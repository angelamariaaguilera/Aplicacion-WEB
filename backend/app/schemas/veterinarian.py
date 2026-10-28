"""Schemas de veterinarios."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class VeterinarianBase(BaseModel):
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    license_number: str = Field(min_length=1, max_length=50)
    specialty: str | None = Field(default=None, max_length=100)
    phone: str | None = Field(default=None, max_length=30)
    email: EmailStr | None = None
    is_active: bool = True


class VeterinarianCreate(VeterinarianBase):
    pass


class VeterinarianUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=80)
    last_name: str | None = Field(default=None, min_length=1, max_length=80)
    license_number: str | None = Field(default=None, min_length=1, max_length=50)
    specialty: str | None = Field(default=None, max_length=100)
    phone: str | None = Field(default=None, max_length=30)
    email: EmailStr | None = None
    is_active: bool | None = None


class VeterinarianResponse(VeterinarianBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    appointments_count: int = 0
    created_at: datetime | None = None
    updated_at: datetime | None = None