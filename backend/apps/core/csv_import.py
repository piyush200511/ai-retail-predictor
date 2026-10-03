"""
Generic CSV import service — batched notifications.

Handlers process each row (no notification), then the importer emits
a single summary notification at the end.
"""
import csv
import io
from decimal import Decimal, InvalidOperation

from django.db import transaction
from rest_framework.exceptions import ValidationError


def parse_csv(file_obj):
    """Read a CSV file-like object into a list of dicts."""
    try:
        content = file_obj.read()
        if isinstance(content, bytes):
            content = content.decode('utf-8-sig')
    except Exception:
        raise ValidationError({'file': 'Could not read file. Ensure it is UTF-8 CSV.'})

    reader = csv.DictReader(io.StringIO(content))
    return list(reader)


def import_csv(*, handler_name, file_obj, user=None):
    """
    Generic import dispatcher.

    Returns: { created, skipped, total, errors: [{ row, message }] }
    Fires ONE summary notification at the end.
    """
    from .csv_handlers import HANDLERS

    handler = HANDLERS.get(handler_name)
    if not handler:
        raise ValidationError({'handler': f'Unknown import type: {handler_name}'})

    rows = parse_csv(file_obj)
    if not rows:
        raise ValidationError({'file': 'CSV file is empty.'})

    created = 0
    skipped = 0
    errors = []

    with transaction.atomic():
        for idx, row in enumerate(rows, start=2):
            try:
                handler(row, user=user)
                created += 1
            except ValidationError as e:
                skipped += 1
                errors.append({'row': idx, 'message': _format_error(e)})
            except Exception as e:
                skipped += 1
                errors.append({'row': idx, 'message': str(e)[:200]})

    # ---------- ONE summary notification for the whole import ----------
    if created > 0:
        try:
            from .services import notify_activity
            entity_map = {
                'products': 'product',
                'suppliers': 'supplier',
                'warehouses': 'warehouse',
                'customers': 'customer',
            }
            entity = entity_map.get(handler_name, 'import')
            label = handler_name.rstrip('s')  # products → product

            notify_activity(
                entity=entity,
                action='import',
                actor=user,
                title=f'Bulk import: {created} {label}{"s" if created != 1 else ""} added',
                message=(
                    f'Imported {created} {label}{"s" if created != 1 else ""} via CSV '
                    f'by {user.name if user else "system"}.'
                    + (f' {skipped} row(s) skipped.' if skipped else '')
                ),
                severity='info',
                link='/import',
                metadata={
                    'import_type': handler_name,
                    'created': created,
                    'skipped': skipped,
                },
            )
        except Exception:
            pass

    return {
        'created': created,
        'skipped': skipped,
        'total': len(rows),
        'errors': errors[:50],
    }


def _format_error(e):
    if hasattr(e, 'detail'):
        detail = e.detail
        if isinstance(detail, dict):
            return '; '.join(f'{k}: {v}' for k, v in detail.items())
        if isinstance(detail, list):
            return '; '.join(str(x) for x in detail)
        return str(detail)
    return str(e)


def to_decimal(val, default='0'):
    if val is None or val == '':
        return Decimal(default)
    try:
        return Decimal(str(val).strip())
    except (InvalidOperation, ValueError):
        raise ValidationError(f'Invalid number: {val}')


def to_bool(val):
    if val is None or val == '':
        return False
    return str(val).strip().lower() in ('true', '1', 'yes', 'y')