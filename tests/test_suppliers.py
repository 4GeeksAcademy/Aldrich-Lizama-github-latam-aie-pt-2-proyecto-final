import asyncio

import pytest
from fastapi import HTTPException
from pydantic import ValidationError
from tinydb import TinyDB

import services.api.routes.suppliers as suppliers_api
from services.api.models import SupplierCreate, SupplierRateUpdate, SupplierStatusUpdate


def _call(endpoint, *args, **kwargs):
    return asyncio.run(endpoint(*args, **kwargs))


@pytest.fixture
def supplier_table(tmp_path, monkeypatch):
    database = TinyDB(str(tmp_path / "suppliers-tests.json"))
    table = database.table("suppliers")
    monkeypatch.setattr(suppliers_api, "get_suppliers_table", lambda: table)
    yield table
    database.close()


def _supplier_payload(**overrides):
    values = {
        "name": "Talent Platform",
        "contacto": "Alex Example",
        "country": "Spain",
        "categories": ["job_boards"],
        "monthly_rate": 125,
        "currency": "EUR",
        "status": "active",
    }
    values.update(overrides)
    return SupplierCreate(**values)


def test_supplier_create_list_filters_and_empty_results(supplier_table):
    created = _call(suppliers_api.create_supplier, _supplier_payload())
    _call(
        suppliers_api.create_supplier,
        _supplier_payload(name="US platform", country="USA", currency="USD"),
    )

    filtered = _call(suppliers_api.list_suppliers, "Spain", "job_boards")
    empty = _call(suppliers_api.list_suppliers, "USA", "ats_software")

    assert created.name == "Talent Platform"
    assert created.id == str(supplier_table.all()[0].doc_id)
    assert len(filtered) == 1
    assert empty == []


def test_supplier_get_and_update_rate_and_status(supplier_table):
    created = _call(suppliers_api.create_supplier, _supplier_payload())

    fetched = _call(suppliers_api.get_supplier, int(created.id))
    updated_rate = _call(
        suppliers_api.update_supplier_rate,
        int(created.id),
        SupplierRateUpdate(monthly_rate=250),
    )
    updated_status = _call(
        suppliers_api.update_supplier_status,
        int(created.id),
        SupplierStatusUpdate(status="suspended"),
    )

    assert fetched.name == "Talent Platform"
    assert updated_rate.monthly_rate == 250
    assert updated_status.status == "suspended"


def test_supplier_soft_delete_removes_listing_and_rejects_repeat(supplier_table):
    created = _call(suppliers_api.create_supplier, _supplier_payload())

    deleted = _call(suppliers_api.delete_supplier, int(created.id))

    assert deleted.status == "suspended"
    assert deleted.deleted_at is not None
    assert _call(suppliers_api.list_suppliers) == []
    with pytest.raises(HTTPException) as error:
        _call(suppliers_api.delete_supplier, int(created.id))
    assert error.value.status_code == 404


def test_supplier_not_found_and_invalid_update_values(supplier_table):
    with pytest.raises(HTTPException) as error:
        _call(suppliers_api.get_supplier, 999)
    assert error.value.status_code == 404

    with pytest.raises(ValidationError):
        SupplierRateUpdate(monthly_rate=0)
    with pytest.raises(ValidationError):
        SupplierStatusUpdate(status="pending")
    with pytest.raises(ValidationError):
        _supplier_payload(country="Spain", currency="USD")
