# ToolMate Asset Management User Guide

## Overview
This guide explains how to use the ToolMate Asset Management system to add, edit, and manage assets efficiently. It also details the automation features that simplify asset handling, especially for laptops.

---

## 1. Adding a New Asset

### Steps:
1. Click the **Add Asset** button.
2. Fill in the asset details in the form:
   - **Laptop Name**: (Auto-filled for Dell laptops; see automation below)
   - **MTU Asset Tag**
   - **Dell Asset Tag**: (If applicable)
   - **Service Tag**
   - **Status**
   - **First Name** and **Last Name** (of the user assigned)
   - **YKD Number** (unique user identifier)
   - **Note** (optional)
3. Click **Save** to add the asset.

### Automation When Adding:
- **Laptop Name Auto-Naming**:
  - If you enter a **Dell Asset Tag** (at least 8 characters):
    - If it contains 'PCAMA', the code after 'PCAMA' is used.
    - Otherwise, the last 5 characters of the tag are used.
    - The Laptop Name is auto-generated as: `QDFWCLPA` + code (e.g., `QDFWCLPAXXXX`).
  - If no Dell Asset Tag is entered, you can manually enter the Laptop Name.
- **Assignment Check**:
  - The system checks if the YKD Number is already assigned to another laptop.
  - If so, it will update the note and status to indicate dual assignment.

### Auto-Generation Rules:
- If you do not enter a Dell Asset Tag, the Laptop Name will be auto-generated for you as the next available QDFWCLPC number (e.g., QDFWCLPC0001, QDFWCLPC0002, etc.).
- The Laptop Name field is non-editable and always filled automatically based on the Dell Asset Tag or, if empty, the next available QDFWCLPC number.

---

## 2. Editing an Asset

### Steps:
1. Click the **Edit** button next to the asset you want to modify.
2. Update the asset details in the modal form.
   - **Laptop Name**:
     - If a **Dell Asset Tag** is present, the Laptop Name field is **disabled** and auto-updated based on the Dell Asset Tag.
     - To change the Laptop Name, update the Dell Asset Tag.
     - If Dell Asset Tag is cleared, Laptop Name becomes editable.
   - Other fields can be edited as needed.
3. Click **Save** to update the asset.

### Automation When Editing:
- **Laptop Name Auto-Naming**:
  - When you change the **Dell Asset Tag**, the Laptop Name is automatically updated using the same logic as when adding.
  - If you remove the Dell Asset Tag, you can manually edit the Laptop Name.
- **Assignment Check**:
  - The system re-checks the YKD Number for assignment conflicts and updates notes/status accordingly.

---


## 3. Importing Assets from CSV

You can bulk import assets using a CSV file. Click the **Import CSV** button and select your file. The table will update automatically after import.

### Required Columns:
- Laptop name
- MTU Asset Tag
- Dell Asset Tag
- Userkey (YKD Number)
- Service tag

### Automation & Scenarios:
- **Laptop Name Auto-Naming**:
  - If a row has a Dell Asset Tag but no Laptop Name, the system will auto-generate the Laptop Name using the same logic as manual entry (see above).
- **YKD Number Handling**:
  - Imported assets will have a blank YKD Number by default, regardless of the CSV value. You can assign a YKD Number later via the Edit modal.
- **Status Assignment**:
  - If the imported row has no YKD Number, status is set to **In Stock**.
  - If a YKD Number is present, status is set to **In Use**.
- **No Note**: Imported assets will not have a note by default.

### Example Scenarios:
- Row with both Laptop Name and Dell Asset Tag: uses provided Laptop Name.
- Row with only Dell Asset Tag: Laptop Name is auto-generated.
- Row with neither: Laptop Name must be set manually after import.
- Row with YKD Number: YKD Number will be blank after import (must assign via Edit).
- Row with only MTU Asset Tag: imported as-is, status is **In Stock**.

See the sample CSV file in your project for more examples.

---

## 4. Business Rules & Automation Summary
- **Dell Asset Tag** drives auto-naming for laptops.
- **Laptop Name** is only editable directly if Dell Asset Tag is empty.
- **Assignment logic** ensures users are not assigned multiple laptops without a note.
- **Audit** and **search** tools help maintain asset integrity and visibility.

---

For further help, contact your ToolMate administrator.
