#!/usr/bin/env python3
"""
validate_auth01.py — Validación completa AUTH-01
=================================================
Valida todos los requisitos de integración de seguridad del API Nexova.

Requisitos:
  1. CRUD de usuarios completo y accesible vía API
  2. Profile vinculado a User (name, phone, address en Profile, no en User)
  3. Role solo admin|manager|user, nuevos usuarios usan "user"
  4. Contraseñas hasheadas, nunca texto plano en BD
  5. Login devuelve JWT válido y firmado
  6. get_current_user decodifica token correctamente
  7. 401 sin token en rutas protegidas
  8. 403 al acceder/modificar credenciales ajenas
  9. Expiración y clave desde variables de entorno
  10. Rutas bajo /auth, /users, /profiles
  11. 5+ rutas fuera de /users y /auth protegidas
  12. User/Profile en TinyDB
  13. Sin regresiones con token válido
"""

import sys
import os
import json

# ── Asegurar que el repo root está en sys.path ──────────
_REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

# ── Requerir configuración antes de importar la aplicación ─
required_environment = ("SECRET_KEY", "ACCESS_TOKEN_EXPIRE_MINUTES")
missing_environment = [
    name for name in required_environment if not os.environ.get(name)
]
if missing_environment:
    raise SystemExit(
        "Faltan variables de entorno obligatorias: "
        + ", ".join(missing_environment)
        + ". Configúralas en .env antes de ejecutar esta validación."
    )

from app.main import app
from app.core.security import (
    SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES,
    hash_password, verify_password, create_access_token,
)
from app.services.db_service import (
    create_user, get_user_by_id, get_user_by_email,
    get_all_users, update_user, delete_user,
    create_profile, get_profile_by_user_id,
    update_profile_by_user_id, delete_profile_by_user_id,
)
from app.schemas.auth_user import RoleEnum
from app.api.deps import get_current_user

# ── Test FastAPI client ─────────────────────────────────
from httpx import AsyncClient, ASGITransport

import asyncio
from datetime import datetime, timedelta, timezone
from pathlib import Path

# ══════════════════════════════════════════════════════════════
#  Contadores
# ══════════════════════════════════════════════════════════════
passed = 0
failed = 0
errors: list[str] = []

def check(name: str, condition: bool, detail: str = ""):
    global passed, failed
    if condition:
        passed += 1
        print(f"  ✅ {name}")
    else:
        failed += 1
        msg = f"  ❌ {name} — {detail}"
        print(msg)
        errors.append(msg)


# ══════════════════════════════════════════════════════════════
#  Setup: limpiar BD de tests previos
# ══════════════════════════════════════════════════════════════
_REPO_ROOT_PATH = Path(
    os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
)
DB_PATH = _REPO_ROOT_PATH / "app" / "services" / "tinydb_storage.json"
if DB_PATH.exists():
    DB_PATH.unlink()

# Test user credentials
TEST_EMAIL = "test_auth01@nexova.com"
TEST_EMAIL_2 = "other_user@nexova.com"
TEST_PASSWORD = "SecurePass123!"
TEST_PASSWORD_2 = "OtherPass456!"
TEST_NAME = "Test User Auth01"
TEST_NAME_2 = "Other User"
TEST_PHONE = "+34 600 123 456"
TEST_ADDRESS = "Calle Test 123, Madrid"


# ══════════════════════════════════════════════════════════════
#  INICIO DE VALIDACIONES
# ══════════════════════════════════════════════════════════════

async def run_all_validations():
    print("\n" + "=" * 70)
    print("  VALIDACIÓN AUTH-01 — Integración de Seguridad Nexova API")
    print("=" * 70)

    # ════════════════════════════════════════════════════════════
    #  1. CRUD de usuarios
    # ════════════════════════════════════════════════════════════
    print("\n📋 1. CRUD de usuarios")

    # 1a. Crear usuario
    user = create_user(
        email=TEST_EMAIL,
        password=TEST_PASSWORD,
        role=RoleEnum.USER,
        name=TEST_NAME,
        phone=TEST_PHONE,
        address=TEST_ADDRESS,
    )
    check("create_user retorna dict", isinstance(user, dict))
    check("create_user incluye id", "id" in user)
    check("create_user email correcto", user["email"] == TEST_EMAIL)
    check("create_user role=user", user["role"] == "user")
    check("create_user is_active=True", user.get("is_active", True) is True)
    check("create_user no hashea en user dict",
          "hashed_password" not in user or user.get("hashed_password") != TEST_PASSWORD)
    check("create_user hashed_password existe en user",
          "hashed_password" in user and len(user["hashed_password"]) > 20)
    check("create_user incluye profile", "profile" in user and user["profile"] is not None)
    check("profile.name == TEST_NAME", user["profile"]["name"] == TEST_NAME)
    check("profile.phone == TEST_PHONE", user["profile"]["phone"] == TEST_PHONE)
    check("profile.address == TEST_ADDRESS", user["profile"]["address"] == TEST_ADDRESS)

    user_id = user["id"]

    # 1b. get_user_by_id
    found = get_user_by_id(user_id)
    check("get_user_by_id retorna usuario", found is not None)
    check("get_user_by_id email coincide", found["email"] == TEST_EMAIL)
    check("get_user_by_id profile incluido", found.get("profile") is not None)

    # 1c. get_user_by_email
    found_email = get_user_by_email(TEST_EMAIL)
    check("get_user_by_email retorna usuario", found_email is not None)
    check("get_user_by_email id coincide", found_email["id"] == user_id)

    # 1d. get_all_users
    all_users = get_all_users()
    check("get_all_users incluye usuario creado",
          any(u["email"] == TEST_EMAIL for u in all_users))

    # 1e. update_user
    updated = update_user(user_id, email=f"updated_{TEST_EMAIL}")
    check("update_user retorna usuario", updated is not None)
    check("update_user email actualizado",
          updated["email"] == f"updated_{TEST_EMAIL}")

    # 1f. delete_user
    deleted = delete_user(user_id)
    check("delete_user retorna True", deleted is True)
    check("delete_user — user ya no existe",
          get_user_by_id(user_id) is None)
    check("delete_user — profile eliminado",
          get_profile_by_user_id(user_id) is None)

    # Re-crear para tests subsiguientes
    user = create_user(
        email=TEST_EMAIL,
        password=TEST_PASSWORD,
        role=RoleEnum.USER,
        name=TEST_NAME,
        phone=TEST_PHONE,
        address=TEST_ADDRESS,
    )
    user_id = user["id"]

    # Crear segundo usuario (para tests de permisos)
    user2 = create_user(
        email=TEST_EMAIL_2,
        password=TEST_PASSWORD_2,
        role=RoleEnum.USER,
        name=TEST_NAME_2,
    )
    user2_id = user2["id"]

    # ════════════════════════════════════════════════════════════
    #  2. Profile vinculado — datos NO en User
    # ════════════════════════════════════════════════════════════
    print("\n📋 2. Profile vinculado a User")

    check("name NO almacenado directamente en user",
          "name" not in user or user.get("name") is None)
    check("phone NO almacenado directamente en user",
          "phone" not in user or user.get("phone") is None)
    check("address NO almacenado directamente en user",
          "address" not in user or user.get("address") is None)

    profile = get_profile_by_user_id(user_id)
    check("get_profile_by_user_id retorna profile", profile is not None)
    check("profile.user_id coincide", profile["user_id"] == user_id)

    updated_profile = update_profile_by_user_id(user_id, {"phone": "+34 999 888 777"})
    check("update_profile_by_user_id funciona", updated_profile is not None)
    check("update_profile_by_user_id cambió phone",
          updated_profile["phone"] == "+34 999 888 777")

    # ════════════════════════════════════════════════════════════
    #  3. Roles válidos
    # ════════════════════════════════════════════════════════════
    print("\n📋 3. Roles válidos")

    check("RoleEnum.ADMIN == 'admin'", RoleEnum.ADMIN.value == "admin")
    check("RoleEnum.MANAGER == 'manager'", RoleEnum.MANAGER.value == "manager")
    check("RoleEnum.USER == 'user'", RoleEnum.USER.value == "user")
    check("Usuario nuevo tiene role=user",
          create_user(
              email="role_test@nexova.com",
              password="TestPass123!",
          )["role"] == "user")

    # Limpiar usuario de prueba de role
    delete_user(get_user_by_email("role_test@nexova.com")["id"])

    # ════════════════════════════════════════════════════════════
    #  4. Contraseñas hasheadas
    # ════════════════════════════════════════════════════════════
    print("\n📋 4. Contraseñas hasheadas")

    hashed = hash_password(TEST_PASSWORD)
    check("hash_password retorna string", isinstance(hashed, str))
    check("hash_password comienza con $2b$ (bcrypt)", hashed.startswith("$2b$"))
    check("hash_password != texto plano", hashed != TEST_PASSWORD)

    check("verify_password correcta",
          verify_password(TEST_PASSWORD, hashed) is True)
    check("verify_password incorrecta",
          verify_password("wrong_password", hashed) is False)

    db_user = get_user_by_email(TEST_EMAIL)
    check("BD almacena hashed_password, no texto plano",
          db_user["hashed_password"] != TEST_PASSWORD)
    check("hashed_password verifica correctamente",
          verify_password(TEST_PASSWORD, db_user["hashed_password"]) is True)

    # ════════════════════════════════════════════════════════════
    #  5. JWT — login devuelve token válido
    # ════════════════════════════════════════════════════════════
    print("\n📋 5. JWT válido y firmado")

    token = create_access_token(data={"sub": str(user_id), "email": TEST_EMAIL})
    check("create_access_token retorna string", isinstance(token, str))
    check("create_access_token no está vacío", len(token) > 20)

    # Decodificar con la misma clave
    from jose import jwt
    decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    check("JWT decodificado correctamente", decoded is not None)
    check("JWT contiene sub", decoded.get("sub") == str(user_id))
    check("JWT contiene email", decoded.get("email") == TEST_EMAIL)
    check("JWT contiene exp", "exp" in decoded)

    # ════════════════════════════════════════════════════════════
    #  6. get_current_user con token válido
    # ════════════════════════════════════════════════════════════
    print("\n📋 6. get_current_user decodifica token")

    current = get_current_user(token)
    check("get_current_user retorna dict", isinstance(current, dict))
    check("get_current_user id coincide", current["id"] == user_id)
    check("get_current_user email coincide", current["email"] == TEST_EMAIL)

    # ════════════════════════════════════════════════════════════
    #  8. 403 — permisos de usuario ajeno
    # ════════════════════════════════════════════════════════════
    print("\n📋 8. 403 al acceder/modificar credenciales ajenas(validación lógica)")

    # Crear un usuario admin real para tests de permisos
    admin_user = create_user(
        email="admin_auth01@nexova.com",
        password="AdminPass123!",
        role=RoleEnum.ADMIN,
        name="Admin User",
    )
    admin_id = admin_user["id"]

    # Los tokens se usarán para comprobar respuestas HTTP reales.
    current_admin = get_current_user(
        create_access_token(data={
            "sub": str(admin_id),
            "email": "admin_auth01@nexova.com",
            "role": "admin",
        })
    )

    current_user_obj = get_current_user(
        create_access_token(data={
            "sub": str(user2_id),
            "email": TEST_EMAIL_2,
            "role": "user",
        })
    )

    check("admin tiene role=admin (desde BD)", current_admin["role"] == "admin",
          f"Role: {current_admin['role']}")

    # ════════════════════════════════════════════════════════════
    #  9. Variables de entorno (expiración y clave)
    # ════════════════════════════════════════════════════════════
    print("\n📋 9. Variables de entorno (no hardcodeadas)")

    # Reimportar módulos para verificar que leen de env
    import importlib
    import app.core.security as sec

    check("SECRET_KEY viene de env (no default inseguro)",
          sec.SECRET_KEY == os.environ["SECRET_KEY"])
    check("ALGORITHM = HS256", sec.ALGORITHM == "HS256")
    check("ACCESS_TOKEN_EXPIRE_MINUTES = 60",
          sec.ACCESS_TOKEN_EXPIRE_MINUTES == 60)

    # ════════════════════════════════════════════════════════════
    #  10. Estructura de rutas /auth, /users, /profiles
    # ════════════════════════════════════════════════════════════
    print("\n📋 10. Estructura de rutas (/auth, /users, /profiles)")

    openapi = app.openapi()
    paths = openapi.get("paths", {})

    auth_paths = [p for p in paths if p.startswith("/auth")]
    users_paths = [p for p in paths if p.startswith("/users")]
    profiles_paths = [p for p in paths if p.startswith("/profiles")]
    suppliers_paths = [p for p in paths if p.startswith("/suppliers")]

    check("Rutas bajo /auth existen", len(auth_paths) > 0, f"Encontradas: {auth_paths}")
    check("Rutas bajo /users existen", len(users_paths) > 0, f"Encontradas: {users_paths}")
    check("Rutas bajo /profiles existen", len(profiles_paths) > 0, f"Encontradas: {profiles_paths}")

    # Listar todas para depuración
    all_routes = []
    for path, methods in sorted(paths.items()):
        for method in methods:
            all_routes.append(f"  {method.upper():6s} {path}")
    print("\nRutas registradas en OpenAPI:")
    for r in all_routes:
        print(r)

    # ════════════════════════════════════════════════════════════
    #  7 + 11. Protección de rutas (401 sin token + 5 suppliers)
    # ════════════════════════════════════════════════════════════
    print("\n📋 7+11. Rutas protegidas (401 sin token + 5 suppliers)")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 7. Sin token → 401
        # Rutas conocidas protegidas
        protected_routes = [
            ("GET", "/auth/me"),
            ("GET", "/users/"),
            ("GET", "/profiles/me"),
            ("GET", "/suppliers"),
            ("GET", "/suppliers/1"),
        ]
        for method, route in protected_routes:
            resp = await client.request(method, route)
            check(f"401 {method} {route} (sin token)",
                  resp.status_code == 401,
                  f"Status: {resp.status_code}, Body: {resp.text[:100]}")

        # 11. 5 rutas suppliers protegidas
        supplier_routes_no_auth = [
            ("GET", "/suppliers"),
            ("GET", "/suppliers/1"),
            ("PATCH", "/suppliers/1/rate"),
            ("PATCH", "/suppliers/1/status"),
            ("DELETE", "/suppliers/1"),
        ]
        protected_suppliers = 0
        for method, route in supplier_routes_no_auth:
            resp = await client.request(method, route)
            if resp.status_code == 401:
                protected_suppliers += 1

        check("5+ rutas suppliers protegidas (401 sin token)",
              protected_suppliers >= 5,
              f"Solo {protected_suppliers} de 5 devolvieron 401")

        # ════════════════════════════════════════════════════════════
        #  14. Sin regresiones — rutas protegidas funcionan con token
        # ════════════════════════════════════════════════════════════
        print("\n📋 14. Sin regresiones (rutas protegidas con token válido)")

        # Primero crear usuario via endpoint y obtener token
        regr_email = "regression_test@nexova.com"
        regr_pass = "Regression123!"

        resp = await client.post("/users/", json={
            "email": regr_email,
            "password": regr_pass,
            "name": "Regression Test",
            "phone": "+34 600 000 000",
        })
        check("POST /users/ (registro público) funciona",
              resp.status_code in (201, 409),
              f"Status: {resp.status_code}, Body: {resp.text[:100]}")

        # Login para obtener token
        resp = await client.post("/auth/login", data={
            "username": regr_email,
            "password": regr_pass,
        })
        check("POST /auth/login funciona",
              resp.status_code == 200,
              f"Status: {resp.status_code}, Body: {resp.text[:100]}")

        if resp.status_code == 200:
            token = resp.json().get("access_token")
            check("Login devuelve access_token",
                  token is not None and len(token) > 20)
            headers = {"Authorization": f"Bearer {token}"}

            # Probar todas las rutas protegidas con token
            protected_with_token = [
                ("GET", "/auth/me"),
                ("GET", "/profiles/me"),
                ("GET", "/suppliers"),
            ]
            all_ok = True
            for method, route in protected_with_token:
                resp = await client.request(method, route, headers=headers)
                ok = resp.status_code not in (401, 403)
                if not ok:
                    all_ok = False
                check(f"Ruta protegida {method} {route} con token → {resp.status_code}",
                      ok, f"Status: {resp.status_code}, Body: {resp.text[:100]}")

            check("Todas las rutas protegidas funcionan con token",
                  all_ok, "Alguna ruta falló con token válido")

            # Autorización real de /users: no-admin recibe 403 y admin sí accede.
            regr_user = get_user_by_email(regr_email)
            admin_headers = {
                "Authorization": f"Bearer {create_access_token(data={'sub': str(admin_id)})}"
            }
            other_user_headers = {
                "Authorization": f"Bearer {create_access_token(data={'sub': str(user2_id)})}"
            }
            list_as_user = await client.get("/users/", headers=headers)
            list_as_admin = await client.get("/users/", headers=admin_headers)
            check("GET /users/ → 403 para usuario normal",
                list_as_user.status_code == 403,
                f"Status: {list_as_user.status_code}")
            check("GET /users/ → 200 para admin",
                list_as_admin.status_code == 200,
                f"Status: {list_as_admin.status_code}")

            own_detail = await client.get(
                f"/users/{regr_user['id']}", headers=headers
            )
            other_detail = await client.get(
                f"/users/{user2_id}", headers=headers
            )
            admin_detail = await client.get(
                f"/users/{user2_id}", headers=admin_headers
            )
            check("GET /users/{id} → 200 para el propietario",
                own_detail.status_code == 200,
                f"Status: {own_detail.status_code}")
            check("GET /users/{id} → 403 para otro usuario",
                other_detail.status_code == 403,
                f"Status: {other_detail.status_code}")
            check("GET /users/{id} → 200 para admin",
                admin_detail.status_code == 200,
                f"Status: {admin_detail.status_code}")

        # ════════════════════════════════════════════════════════════
        #  13. TinyDB storage
        # ════════════════════════════════════════════════════════════
        print("\n📋 13. Datos en TinyDB")

        check("Archivo tinydb_storage.json existe",
              DB_PATH.exists() and DB_PATH.stat().st_size > 0,
              f"Path: {DB_PATH}")

        if DB_PATH.exists():
            with open(DB_PATH) as f:
                raw = json.load(f)
            check("TinyDB contiene tabla 'users'",
                  "users" in raw and isinstance(raw["users"], dict) and len(raw["users"]) > 0)
            check("TinyDB contiene tabla 'profiles'",
                  "profiles" in raw and isinstance(raw["profiles"], dict) and len(raw["profiles"]) > 0)

        # ════════════════════════════════════════════════════════════
        #  7b. Sin token → 401 en todos los endpoints protegidos
        # ════════════════════════════════════════════════════════════
        print("\n📋 7b. Todos los endpoints protegidos devuelven 401 sin token")

        all_endpoints_no_auth = [
            ("GET", "/auth/me"),
            ("GET", "/users/"),
            ("GET", "/users/1"),
            ("PUT", "/users/1"),
            ("DELETE", "/users/1"),
            ("GET", "/profiles/me"),
            ("PUT", "/profiles/me"),
            ("GET", "/suppliers"),
            ("GET", "/suppliers/1"),
            ("PATCH", "/suppliers/1/rate"),
            ("PATCH", "/suppliers/1/status"),
            ("DELETE", "/suppliers/1"),
        ]
        all_401 = True
        for method, route in all_endpoints_no_auth:
            resp = await client.request(method, route)
            if resp.status_code != 401:
                all_401 = False
                check(f"401 {method} {route}", False, f"Status: {resp.status_code}")
        if all_401:
            check("Todas las rutas protegidas → 401 sin token", True)

    # ════════════════════════════════════════════════════════════
    #  Resumen final
    # ════════════════════════════════════════════════════════════
    print("\n" + "=" * 70)
    print("  RESUMEN DE VALIDACIÓN")
    print("=" * 70)
    print(f"  ✅ Pasadas: {passed}")
    print(f"  ❌ Falladas: {failed}")
    print(f"  📊 Total: {passed + failed}")
    print()

    if errors:
        print("  ERRORES DETECTADOS:")
        for e in errors:
            print(f"    {e}")
    else:
        print("  🎉 ¡Todas las validaciones pasaron correctamente!")

    print()
    return failed == 0


if __name__ == "__main__":
    success = asyncio.run(run_all_validations())
    sys.exit(0 if success else 1)