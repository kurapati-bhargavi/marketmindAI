from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.sale import Sale
from app.models.user import User
from app.auth.dependencies import require_role
from app.services.data_preprocessor import validate_and_preprocess_csv
from app.services.sales_service import batch_import_sales

router = APIRouter(
    prefix="/sales-upload",
    tags=["Sales Upload"]
)


@router.post("/preview")
async def preview_sales_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "Store Manager", "System Administrator"))
):
    """
    Dry-run preview endpoint to inspect and validate CSV structure before committing.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Please select a CSV file.")

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files (.csv) are accepted.")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded CSV file is empty.")

    result = validate_and_preprocess_csv(contents, file.filename)

    # Check for duplicate
    is_duplicate = False
    if result.get("file_hash"):
        existing = db.query(Sale).filter(Sale.import_hash == result["file_hash"]).first()
        if existing:
            is_duplicate = True

    result["is_duplicate"] = is_duplicate
    return result


@router.post("/csv")
async def upload_sales_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Business Owner", "Store Manager", "System Administrator"))
):
    """
    Upload, validate and ingest sales CSV transactions into database.
    """
    if not file.filename or not file.filename.lower().endswith(".csv"):
        return {
            "success": False,
            "message": "Only valid .csv files are accepted."
        }

    contents = await file.read()
    if not contents:
        return {
            "success": False,
            "message": "CSV file is empty."
        }

    parsed = validate_and_preprocess_csv(contents, file.filename)
    if not parsed.get("valid"):
        return {
            "success": False,
            "message": parsed.get("message", "CSV validation failed."),
            "errors": parsed.get("invalid_rows", [])
        }

    # Duplicate check
    file_hash = parsed.get("file_hash")
    existing_sale = db.query(Sale).filter(Sale.import_hash == file_hash).first()
    if existing_sale:
        return {
            "success": False,
            "message": "This dataset has already been uploaded previously.",
            "duplicate": True
        }

    valid_rows = parsed.get("valid_rows", [])
    if not valid_rows:
        return {
            "success": False,
            "message": "No valid transaction rows found in the CSV."
        }

    try:
        import_result = batch_import_sales(db, valid_rows, file_hash)
        return import_result
    except Exception as e:
        db.rollback()
        return {
            "success": False,
            "message": f"Database error during CSV import: {str(e)}"
        }