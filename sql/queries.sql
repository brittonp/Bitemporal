USE dept_emp_bitemporal;
GO

-- ============================================================
-- Update department name and valid_from for dept_id = 10
-- ============================================================
UPDATE btd.department
SET
    dept_name = 'New Sales',
    valid_from = '2025-10-01'
WHERE 
    dept_id = 10;
GO

SELECT d.dept_hist_id,d.dept_id,d.dept_name,d.location,d.valid_from,CASE WHEN d.valid_to = btd.fn_infinity() THEN NULL ELSE d.valid_to END AS valid_to,d.tran_from,CASE WHEN d.tran_to = btd.fn_infinity() THEN NULL ELSE d.tran_to END AS tran_to,CASE WHEN d.tran_to = btd.fn_infinity() THEN 'Current'ELSE 'Historical' END record_status FROM btd.department d WHERE d.dept_id = 10 ORDER BY d.dept_hist_id FOR JSON AUTO, INCLUDE_NULL_VALUES


-- ============================================================
-- Select department history for dept_id = 10
-- ============================================================
SELECT
    d.dept_hist_id,
    d.dept_id,
    d.dept_name,
    d.location,
    d.valid_from,
    CASE
        WHEN d.valid_to = btd.fn_infinity() THEN NULL
        ELSE d.valid_to
    END AS valid_to,
    d.tran_from,
    CASE
        WHEN d.tran_to = btd.fn_infinity() THEN NULL
        ELSE d.tran_to
    END AS tran_to
FROM 
	btd.department d
WHERE 
	d.dept_id = 10
ORDER BY 
	d.dept_hist_id;
GO


-- ============================================================
-- Revert department name for dept_id = 10 to 'Original Sales'
-- ============================================================
UPDATE btd.department
SET
    dept_name = 'Original Sales',
    valid_from = '2020-06-01'
WHERE 
    dept_id = 10;
GO

UPDATE btd.department
SET
    dept_name = 'Temp',
    valid_from = '2021-01-01'
WHERE 
    dept_id = 10;
GO

-- ============================================================
-- Select full department history for dept_id = 10
-- ============================================================
SELECT 
	*
FROM 
	btd.department
WHERE 
	dept_id = 10
ORDER BY 
	dept_hist_id;
GO

-- ============================================================
-- Optional queries / testing department current view or getter procedure
-- Uncomment as needed
-- ============================================================

--SELECT * FROM btd.vw_department_current;

--EXEC btd.get_department @dept_id = 10;
--EXEC btd.get_department @dept_id = 10, @tran_date = '2025-01-01', @valid_date = '2026-01-01';
--EXEC btd.get_department @dept_id = 10, @tran_date = '2026-01-01', @valid_date = '2026-01-01';
--EXEC btd.get_department @dept_id = 10, @tran_date = '2026-01-01', @valid_date = '2023-01-01';
--EXEC btd.get_department @dept_id = 10, @tran_date = '2026-01-01', @valid_date = '2021-09-01';
--EXEC btd.get_department @dept_id = 10, @tran_date = '2025-01-01', @valid_date = '2021-09-01';
GO

-- ============================================================
-- Check current UTC datetime
-- ============================================================
SELECT SYSUTCDATETIME();
GO

UPDATE btd.Employee SET dept_id = 20, job_title = 'Controller', valid_from = '2022-10-01' WHERE emp_id = 100;