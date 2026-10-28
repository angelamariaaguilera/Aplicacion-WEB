"""Schemas de propietarios."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class OwnerBase(BaseModel):
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    document_number: str | None = Field(default=None, max_length=30)
    phone: str = Field(min_length=1, max_length=30)
    email: EmailStr | None = None
    address: str | None = Field(default=None, max_length=200)


class OwnerCreate(OwnerBase):
    pass


class OwnerUpdate(BaseModel):
    """Actualización parcial: solo se cambian los campos enviados."""

    first_name: str | None = Field(default=None, min_length=1, max_length=80)
    last_name: str | None = Field(default=None, min_length=1, max_length=80)
    document_number: str | None = Field(default=None, max_length=30)
    phone: str | None = Field(default=None, min_length=1, max_length=30)
    email: EmailStr | None = None
    address: str | None = Field(default=None, max_length=200)


class OwnerResponse(OwnerBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    pets_count: int = 0
    created_at: datetime | None = None
    updated_at: datetime | None = None