"""add_location_fields_to_shelter_contact

Revision ID: 345d2c21b2af
Revises: ff48c799759d
Create Date: 2025-09-10 00:33:49.964911

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '345d2c21b2af'
down_revision: Union[str, Sequence[str], None] = 'ff48c799759d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('shelters',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=200), nullable=False),
    sa.Column('email', sa.String(length=255), nullable=False),
    sa.Column('hashed_password', sa.String(length=255), nullable=False),
    sa.Column('phone', sa.String(length=20), nullable=True),
    sa.Column('contact_hours', sa.String(length=100), nullable=True),
    sa.Column('website', sa.String(length=255), nullable=True),
    sa.Column('address', sa.String(length=255), nullable=True),
    sa.Column('city', sa.String(length=100), nullable=False),
    sa.Column('state', sa.String(length=50), nullable=False),
    sa.Column('zip_code', sa.String(length=10), nullable=True),
    sa.Column('country', sa.String(length=100), nullable=True),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('capacity', sa.Integer(), nullable=True),
    sa.Column('license_number', sa.String(length=100), nullable=True),
    sa.Column('is_verified', sa.Boolean(), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_shelters_email'), 'shelters', ['email'], unique=True)
    op.create_index(op.f('ix_shelters_id'), 'shelters', ['id'], unique=False)
    op.create_index(op.f('ix_shelters_name'), 'shelters', ['name'], unique=False)
    op.create_table('users',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('email', sa.String(length=255), nullable=False),
    sa.Column('username', sa.String(length=100), nullable=False),
    sa.Column('hashed_password', sa.String(length=255), nullable=False),
    sa.Column('full_name', sa.String(length=200), nullable=False),
    sa.Column('phone', sa.String(length=20), nullable=True),
    sa.Column('role', sa.Enum('ADOPTER', 'SHELTER', 'ADMIN', name='userrole'), nullable=True),
    sa.Column('preferred_pet_type', sa.Enum('DOG', 'CAT', 'BIRD', 'RABBIT', 'OTHER', name='pettype'), nullable=True),
    sa.Column('preferred_age_min', sa.Integer(), nullable=True),
    sa.Column('preferred_age_max', sa.Integer(), nullable=True),
    sa.Column('activity_level', sa.Enum('LOW', 'MODERATE', 'HIGH', 'VERY_HIGH', name='activitylevel'), nullable=True),
    sa.Column('has_children', sa.Boolean(), nullable=True),
    sa.Column('preferred_breeds', sa.Text(), nullable=True),
    sa.Column('house_type', sa.Enum('APARTMENT', 'HOUSE', 'CONDO', 'FARM', name='housetype'), nullable=True),
    sa.Column('has_yard', sa.Boolean(), nullable=True),
    sa.Column('experience_level', sa.String(length=50), nullable=True),
    sa.Column('has_other_pets', sa.Boolean(), nullable=True),
    sa.Column('preferred_pet_size', sa.Enum('SMALL', 'MEDIUM', 'LARGE', 'EXTRA_LARGE', name='petsize'), nullable=True),
    sa.Column('max_adoption_fee', sa.Float(), nullable=True),
    sa.Column('preferred_temperament', sa.Text(), nullable=True),
    sa.Column('basic_preferences_complete', sa.Boolean(), nullable=True),
    sa.Column('extended_preferences_complete', sa.Boolean(), nullable=True),
    sa.Column('city', sa.String(length=100), nullable=True),
    sa.Column('state', sa.String(length=50), nullable=True),
    sa.Column('zip_code', sa.String(length=10), nullable=True),
    sa.Column('country', sa.String(length=100), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)
    op.create_table('pets',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('pet_type', sa.Enum('DOG', 'CAT', 'BIRD', 'RABBIT', 'OTHER', name='pettype'), nullable=False),
    sa.Column('breed', sa.String(length=100), nullable=True),
    sa.Column('age_years', sa.Integer(), nullable=True),
    sa.Column('age_months', sa.Integer(), nullable=True),
    sa.Column('size', sa.Enum('SMALL', 'MEDIUM', 'LARGE', 'EXTRA_LARGE', name='petsize'), nullable=False),
    sa.Column('weight', sa.Float(), nullable=True),
    sa.Column('color', sa.String(length=100), nullable=True),
    sa.Column('gender', sa.String(length=10), nullable=True),
    sa.Column('is_spayed_neutered', sa.Boolean(), nullable=True),
    sa.Column('temperament', sa.Text(), nullable=True),
    sa.Column('activity_level', sa.Enum('LOW', 'MODERATE', 'HIGH', 'VERY_HIGH', name='activitylevel'), nullable=True),
    sa.Column('good_with_kids', sa.Boolean(), nullable=True),
    sa.Column('good_with_dogs', sa.Boolean(), nullable=True),
    sa.Column('good_with_cats', sa.Boolean(), nullable=True),
    sa.Column('good_with_other_animals', sa.Boolean(), nullable=True),
    sa.Column('house_trained', sa.Boolean(), nullable=True),
    sa.Column('medical_history', sa.Text(), nullable=True),
    sa.Column('special_needs', sa.Text(), nullable=True),
    sa.Column('vaccination_status', sa.String(length=50), nullable=True),
    sa.Column('adoption_status', sa.Enum('AVAILABLE', 'PENDING', 'ADOPTED', 'ON_HOLD', name='adoptionstatus'), nullable=True),
    sa.Column('adoption_fee', sa.Float(), nullable=True),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('primary_photo_url', sa.String(length=500), nullable=True),
    sa.Column('additional_photos', sa.Text(), nullable=True),
    sa.Column('shelter_id', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('match_score', sa.Float(), nullable=True),
    sa.ForeignKeyConstraint(['shelter_id'], ['shelters.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_pets_id'), 'pets', ['id'], unique=False)
    op.create_index(op.f('ix_pets_name'), 'pets', ['name'], unique=False)
    op.create_table('user_favorites',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('pet_id', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
    sa.ForeignKeyConstraint(['pet_id'], ['pets.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_favorites_id'), 'user_favorites', ['id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_user_favorites_id'), table_name='user_favorites')
    op.drop_table('user_favorites')
    op.drop_index(op.f('ix_pets_name'), table_name='pets')
    op.drop_index(op.f('ix_pets_id'), table_name='pets')
    op.drop_table('pets')
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
    op.drop_index(op.f('ix_shelters_name'), table_name='shelters')
    op.drop_index(op.f('ix_shelters_id'), table_name='shelters')
    op.drop_index(op.f('ix_shelters_email'), table_name='shelters')
    op.drop_table('shelters')
