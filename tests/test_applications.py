import asyncio

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.api.applications import (
    ApplicationCardCreate,
    ApplicationCreate,
    ApplicationUpdate,
    create_application,
    delete_application,
    get_my_card,
    list_applications,
    update_application,
    upsert_my_card,
)


def _call(endpoint, *args, **kwargs):
    return asyncio.run(endpoint(*args, **kwargs))


def test_application_create_and_list_are_scoped_to_user():
    owner = {"id": 11}
    other = {"id": 12}
    created = _call(
        create_application,
        ApplicationCreate(job_title="Consultant", company_name="Nexova"),
        owner,
    )
    _call(
        create_application,
        ApplicationCreate(job_title="Analyst", company_name="Nexova"),
        other,
    )

    result = _call(list_applications, owner)

    assert created["status"] == "pending"
    assert len(result) == 1
    assert result[0]["id"] == created["id"]
    assert result[0]["user_id"] == owner["id"]


def test_application_schema_rejects_empty_title_and_unknown_status():
    with pytest.raises(ValidationError):
        ApplicationCreate(job_title="", company_name="Nexova")
    with pytest.raises(ValidationError):
        ApplicationCreate(
            job_title="Consultant", company_name="Nexova", status="hired"
        )


def test_application_update_handles_changes_and_empty_patch():
    owner = {"id": 21}
    created = _call(
        create_application,
        ApplicationCreate(job_title="Analyst", company_name="Nexova"),
        owner,
    )

    unchanged = _call(update_application, created["id"], ApplicationUpdate(), owner)
    updated = _call(
        update_application,
        created["id"],
        ApplicationUpdate(status="reviewing", notes="Reviewed"),
        owner,
    )

    assert unchanged["job_title"] == "Analyst"
    assert updated["status"] == "reviewing"
    assert updated["notes"] == "Reviewed"


def test_application_update_and_delete_reject_missing_or_other_users_record():
    owner = {"id": 31}
    other = {"id": 32}
    created = _call(
        create_application,
        ApplicationCreate(job_title="Analyst", company_name="Nexova"),
        owner,
    )

    for endpoint, args in (
        (update_application, (created["id"], ApplicationUpdate(), other)),
        (delete_application, (created["id"], other)),
        (delete_application, (999, owner)),
    ):
        with pytest.raises(HTTPException) as error:
            _call(endpoint, *args)
        assert error.value.status_code == 404

    assert _call(delete_application, created["id"], owner)["message"]


def test_application_card_create_update_and_empty_state():
    user = {"id": 41}

    assert _call(get_my_card, user) == {}
    created = _call(
        upsert_my_card,
        ApplicationCardCreate(full_name="Alex Example", skills="Python"),
        user,
    )
    updated = _call(
        upsert_my_card,
        ApplicationCardCreate(full_name="Alex Example Updated"),
        user,
    )
    unchanged = _call(upsert_my_card, ApplicationCardCreate(), user)

    assert created["user_id"] == user["id"]
    assert updated["id"] == created["id"]
    assert updated["full_name"] == "Alex Example Updated"
    assert unchanged["id"] == created["id"]
    assert _call(get_my_card, user)["full_name"] == "Alex Example Updated"
