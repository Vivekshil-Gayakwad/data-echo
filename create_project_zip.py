import os
import zipfile

def create_zip():
    base_dir = os.path.abspath(os.path.dirname(__file__))
    workspace_dir = os.path.abspath(os.path.join(base_dir, ".."))
    zip_filename = os.path.join(workspace_dir, "Data_Echo_Complete_Project.zip")

    # Folders/files to exclude
    exclude_dirs = {
        "node_modules",
        ".git",
        "__pycache__",
        ".gemini",
        ".idea",
        ".vscode"
    }
    exclude_extensions = {
        ".pyc",
        ".pyo",
        ".log"
    }

    print(f"Creating complete archive at: {zip_filename}")
    total_files = 0
    total_size = 0

    with zipfile.ZipFile(zip_filename, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zipf:
        # 1. Add Data_Echo_Project_Documentation.docx at root of zip
        doc_path = os.path.join(workspace_dir, "Data_Echo_Project_Documentation.docx")
        if os.path.exists(doc_path):
            zipf.write(doc_path, arcname="Data_Echo_Project_Documentation.docx")
            total_files += 1
            total_size += os.path.getsize(doc_path)
            print("  + Added Data_Echo_Project_Documentation.docx")

        # 2. Add data-echo directory
        for root, dirs, files in os.walk(base_dir):
            # Prune excluded directories
            dirs[:] = [d for d in dirs if d not in exclude_dirs]

            for file in files:
                ext = os.path.splitext(file)[1].lower()
                if ext in exclude_extensions:
                    continue

                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, workspace_dir)

                zipf.write(full_path, arcname=rel_path)
                total_files += 1
                total_size += os.path.getsize(full_path)

    zip_size_mb = os.path.getsize(zip_filename) / (1024 * 1024)
    raw_size_mb = total_size / (1024 * 1024)
    print("\n✅ ZIP Archive Created Successfully!")
    print(f"  Archive Path: {zip_filename}")
    print(f"  Total Files Packaged: {total_files}")
    print(f"  Uncompressed Size: {raw_size_mb:.2f} MB")
    print(f"  Compressed ZIP Size: {zip_size_mb:.2f} MB")

if __name__ == "__main__":
    create_zip()
