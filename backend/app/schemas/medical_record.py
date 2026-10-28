"""Schemas de historias clínicas."""

from datetime import date, datetime, time
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class MedicalRecordBase(BaseModel):
    pet_id: int = Field(gt=0)
    veterinarian_id: int = Field(gt=0)
    appointment_id: int | None = Field(default=None, gt=0)
    consultation_date: datetime | None = None
    symptoms: str | None = None
    diagnosis: str | None = None
    treatment: str | None = None
    observations: str | None = None
    weight: Decimal | None = Field(default=None, gt=0, decimal_places=2, max_digits=6)

    @field_validator("weight")
    @classmethod
    def check_weight(cls, value: Decimal | None) -> Decimal | None:
        """Regla de negocio 4 aplicada también a la historia clínica."""
        if value is not None and value <= 0:
            raise ValueError("El peso debe ser mayor que 0")
        return value


class MedicalRecordCreate(MedicalRecordBase):
    pass


class MedicalRecordUpdate(BaseModel):
    veterinarian_id: int | None = Field(default=None, gt=0)
    appointment_id: int | None = Field(default=None, gt=0)
    consultation_date: datetime | None = None
    symptoms: str | None = None
    diagnosis: str | None = None
    treatment: str | None = None
    observations: str | None = None
    weight: Decimal | None = Field(default=None, gt=0, decimal_places=2, max_digits=6)

    @field_validator("weight")
    @classmethod
    def check_weight(cls, value: Decimal | None) -> Decimal | None:
        if value is not None and value <= 0:
            raise ValueError("El peso debe ser mayor que 0")
        return value


# --- Objetos anidados que llegan por JOIN ---


class PetBrief(BaseModel):
    id: int
    name: str
    species: str
    breed: str | None = None


class VeterinarianBrief(BaseModel):
    id: int
    full_name: str
    specialty: str | None = None


class AppointmentBrief(BaseModel):
    id: int
    appointment_date: date
    appointment_time: time | None = None
    status: str | None = None


class MedicalRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    consultation_date: datetime
    symptoms: str | None = None
    diagnosis: str | None = None
    treatment: str | None = None
    observations: str | None = None
    weight: Decimal | None = None
    pet: PetBrief | None = None
    veterinarian: VeterinarianBrief | None = None
    appointment: AppointmentBrief | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None