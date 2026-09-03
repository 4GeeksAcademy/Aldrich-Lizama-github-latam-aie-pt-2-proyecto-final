#!/usr/bin/env python3
"""
auth_user.py — Nexova API · Schemas de Autenticación y Usuarios
=================================================================
Schemas Pydantic para:
  - Enumeración de roles (RoleEnum)
  - Perfil de usuario (Profile)
  - CRUD de usuarios (UserCreate, UserUpdate, UserResponse)
  - Token JWT (Token, TokenData)

Requerimientos adicionales:
  pip install "pydantic[email-validator]>=2.0.0"

Uso:
    from app.schemas.auth_user import (
        RoleEnum, UserCreate, UserResponse, Token, ...
    )
"""

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


# ══════════════════════════════════════════════════════════
#  Enumeraciones
# ══════════════════════════════════════════════════════════


class RoleEnum(str, Enum):
    """Roles del sistema para el control de acceso.

    Valores:
        admin:   Acceso total al sistema.
        manager: Acceso a gestión de proveedores e incidencias.
        user:    Acceso solo lectura / operaciones básicas.
    """

    ADMIN = "admin"
    MANAGER = "manager"
    USER = "user"


# ══════════════════════════════════════════════════════════
#  Perfil (Profile)
# ══════════════════════════════════════════════════════════


class ProfileBase(BaseModel):
    """Campos comunes del perfil de un usuario."""

    name: str = Field(
        ...,
        min_length=1,
        max_length=120,
        description="Nombre completo del usuario",
    )
    phone: Optional[str] = Field(
        None,
        max_length=30,
        description="Teléfono de contacto (ej: +34 612 345 678)",
    )
    address: Optional[str] = Field(
        None,
        max_length=250,
        description="Dirección postal",
    )


class ProfileCreate(ProfileBase):
    """Schema para crear un perfil (todos los campos obligatorios de ProfileBase)."""
    pass


class ProfileUpdate(BaseModel):
    """Schema para actualizar parcialmente un perfil.

    Todos los campos son opcionales: solo se actualizan los que se envían.
    """

    name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=120,
    )
    phone: Optional[str] = Field(
        None,
        max_length=30,
    )
    address: Optional[str] = Field(
        None,
        max_length=250,
    )


class ProfileResponse(ProfileBase):
    """Schema de respuesta que incluye el identificador del perfil."""

    id: int = Field(..., description="ID único del perfil")
    user_id: int = Field(..., description="ID del usuario al que pertenece")

    model_config = {"from_attributes": True}


# ══════════════════════════════════════════════════════════
#  Usuario (User)
# ══════════════════════════════════════════════════════════


class UserCreate(BaseModel):
    """Schema para registrar un nuevo usuario.

    Incluye campos opcionales del perfil que se pueden
    enviar en la misma request de creación.
    """

    email: EmailStr = Field(
        ...,
        description="Correo electrónico del usuario (validado como email)",
    )
    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="Contraseña en texto plano (mín. 8 caracteres)",
    )

    # Campos opcionales del perfil inicial
    name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=120,
        description="Nombre completo (crea el perfil automáticamente)",
    )
    phone: Optional[str] = Field(
        None,
        max_length=30,
    )
    address: Optional[str] = Field(
        None,
        max_length=250,
    )


class UserUpdate(BaseModel):
    """Schema para actualizar un usuario existente.

    Todos los campos son opcionales. Solo se actualizan
    los campos enviados explícitamente.
    """

    email: Optional[EmailStr] = Field(
        None,
        description="Nuevo correo electrónico",
    )
    password: Optional[str] = Field(
        None,
        min_length=8,
        max_length=128,
        description="Nueva contraseña (mín. 8 caracteres)",
    )
    role: Optional[RoleEnum] = Field(
        None,
        description="Nuevo rol del usuario",
    )


class UserResponse(BaseModel):
    """Schema de respuesta para un usuario (sin contraseña ni perfil)."""

    id: int = Field(..., description="ID único del usuario")
    email: EmailStr = Field(..., description="Correo electrónico")
    is_active: bool = Field(
        True,
        description="Indica si la cuenta está activa",
    )
    role: RoleEnum = Field(
        RoleEnum.USER,
        description="Rol del usuario en el sistema",
    )
    created_at: datetime = Field(
        ...,
        description="Fecha y hora de creación",
    )

    model_config = {"from_attributes": True}


class UserWithProfileResponse(UserResponse):
    """Schema de respuesta que extiende UserResponse con el perfil."""

    profile: Optional[ProfileResponse] = Field(
        None,
        description="Perfil asociado al usuario (si existe)",
    )


# ══════════════════════════════════════════════════════════
#  Token JWT
# ══════════════════════════════════════════════════════════


class Token(BaseModel):
    """Schema para la respuesta de autenticación (login / refresh)."""

    access_token: str = Field(
        ...,
        description="Token JWT firmado",
    )
    token_type: str = Field(
        default="bearer",
        description="Tipo de token (siempre 'bearer')",
    )


class TokenData(BaseModel):
    """Schema para el payload decodificado del token JWT."""

    user_id: Optional[int] = Field(
        None,
        description="ID del usuario autenticado (extraído del 'sub')",
    )