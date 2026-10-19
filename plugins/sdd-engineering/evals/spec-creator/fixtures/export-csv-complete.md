Write a spec for "Export report as CSV" in a generic web app.

The user must be able to export the currently filtered report table as a CSV file.
The export must include exactly the visible columns, in the visible order.
The file name must be `report-<YYYY-MM-DD>.csv`.
If the table is empty, the export button must be disabled.
Exports of more than 10,000 rows must show a progress message and finish within 30 seconds.
Cells are plain text; dates use ISO 8601. Only signed-in users may export.
