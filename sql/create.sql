USE BitemporalDB;
GO

-- ============================================================
-- Create btd Schema
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'btd')
BEGIN
    EXEC('CREATE SCHEMA btd');
END
GO


-- ============================================================
-- Utility function
-- ============================================================
CREATE OR ALTER FUNCTION btd.fn_infinity()
RETURNS DATETIME2(7)
AS
BEGIN
    RETURN '9999-12-31 23:59:59.9999999';
END;
GO

-- ============================================================
-- Cleanup
-- ============================================================
IF OBJECT_ID('btd.employee', 'U') IS NOT NULL 
    DROP TABLE btd.employee;
IF OBJECT_ID('btd.department', 'U') IS NOT NULL 
    DROP TABLE btd.department;
IF OBJECT_ID('btd.department_master', 'U') IS NOT NULL 
    DROP TABLE btd.department_master;
IF OBJECT_ID('btd.vw_department_current', 'V') IS NOT NULL 
    DROP VIEW btd.vw_department_current;
GO

-- ============================================================
-- Department Master Table
-- ============================================================
CREATE TABLE btd.department_master (
    dept_id INT PRIMARY KEY,
    created_ts DATETIME2(7) NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- ============================================================
-- Department History Table
-- ============================================================
CREATE TABLE btd.department (
    dept_hist_id BIGINT IDENTITY PRIMARY KEY,
    dept_id      INT NOT NULL,
    dept_name    NVARCHAR(200) NOT NULL,
    location     NVARCHAR(200),
    valid_from   DATETIME2(7) NOT NULL,
    valid_to     DATETIME2(7) NOT NULL,
    tran_from    DATETIME2(7) NOT NULL,
    tran_to      DATETIME2(7) NOT NULL,
    CONSTRAINT uq_department_version UNIQUE (dept_id, valid_from, tran_from),
    CONSTRAINT fk_department_master FOREIGN KEY (dept_id) REFERENCES btd.department_master(dept_id)
);
GO

-- ============================================================
-- Employee History Table
-- ============================================================
CREATE TABLE btd.employee (
    emp_hist_id  BIGINT IDENTITY PRIMARY KEY,
    emp_id       INT NOT NULL,
    dept_id      INT NOT NULL,
    first_name   NVARCHAR(100) NOT NULL,
    last_name    NVARCHAR(100) NOT NULL,
    job_title    NVARCHAR(200),
    hire_date    DATE NOT NULL,
    term_date    DATE NULL,
    valid_from   DATETIME2(7) NOT NULL,
    valid_to     DATETIME2(7) NOT NULL,
    tran_from    DATETIME2(7) NOT NULL,
    tran_to      DATETIME2(7) NOT NULL,
    CONSTRAINT uq_employee_version UNIQUE (emp_id, valid_from, tran_from),
    CONSTRAINT fk_employee_department FOREIGN KEY (dept_id) REFERENCES btd.department_master(dept_id)
);
GO

-- ============================================================
-- Current Department View
-- ============================================================
CREATE VIEW btd.vw_department_current
AS
SELECT d.*
FROM btd.department d
WHERE SYSUTCDATETIME() >= d.valid_from 
  AND SYSUTCDATETIME() < d.valid_to
  AND SYSUTCDATETIME() >= d.tran_from 
  AND SYSUTCDATETIME() < d.tran_to;
GO

-- ============================================================
-- Department Update Trigger
-- ============================================================
CREATE OR ALTER TRIGGER 
	btd.tr_department_update
ON 
	btd.department
INSTEAD OF UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF (UPDATE(dept_id) OR UPDATE(tran_from) OR UPDATE(tran_to) OR UPDATE(valid_to))
    BEGIN
        THROW 50001, 'Updates to dept_id, tran_from, tran_to or valid_to are not allowed.', 1;
        ROLLBACK TRANSACTION;
        RETURN;
    END;

    IF NOT UPDATE(valid_from)
    BEGIN
        THROW 50002, 'A valid_from date is required.', 1;
        ROLLBACK TRANSACTION;
        RETURN;
    END;

    DECLARE @affect_dept_hist_id BIGINT;
    DECLARE @now DATETIME2(7) = SYSUTCDATETIME();

    -- 1. Find the dept_hist_id to be affected
	SELECT
		@affect_dept_hist_id = d.dept_hist_id
    FROM 
		deleted d
    JOIN 
		inserted i 
	ON 
		d.dept_hist_id = i.dept_hist_id
    WHERE 
		i.valid_from >= d.valid_from 
	AND 
		i.valid_from < d.valid_to
    AND 
		d.tran_to = btd.fn_infinity()

    -- Backfill record
    INSERT INTO 
		btd.department 
	(
        dept_id, 
		dept_name, 
		location,
        valid_from, 
		valid_to, 
		tran_from, 
		tran_to
    )
    SELECT
        d.dept_id,
        d.dept_name,
        d.location,
        d.valid_from,
        i.valid_from,
        @now,
        btd.fn_infinity()
    FROM 
		deleted d
    JOIN 
		inserted i 
	ON 
		d.dept_hist_id = i.dept_hist_id
    WHERE 
        d.dept_hist_id = @affect_dept_hist_id
    AND 
		d.valid_from != i.valid_from;

    -- Close old version
    UPDATE 
		btd.Department
    SET 
		tran_to = @now
    WHERE
        dept_hist_id = @affect_dept_hist_id;

    -- Insert new version
    INSERT INTO 
		btd.department 
	(
        dept_id, 
		dept_name, 
		location,
        valid_from, 
		valid_to, 
		tran_from, 
		tran_to
    )
    SELECT
        i.dept_id,
        i.dept_name,
        i.location,
        i.valid_from,
        i.valid_to,
        @now,
        btd.fn_infinity()
    FROM
        inserted i
    WHERE
        i.dept_hist_id = @affect_dept_hist_id;
END;
GO

-- ============================================================
-- Employee Update Trigger
-- ============================================================
CREATE OR ALTER TRIGGER 
	btd.tr_employee_update
ON 
	btd.employee
INSTEAD OF UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF (UPDATE(emp_id) OR UPDATE(tran_from) OR UPDATE(tran_to) OR UPDATE(valid_to))
    BEGIN
        THROW 50003, 'Updates to emp_id, tran_from, tran_to or valid_to are not allowed.', 1;
        ROLLBACK TRANSACTION;
        RETURN;
    END;

    IF NOT UPDATE(valid_from)
    BEGIN
        THROW 50002, 'A valid_from date is required.', 1;
        ROLLBACK TRANSACTION;
        RETURN;
    END;

    DECLARE @affect_emp_hist_id BIGINT;
    DECLARE @now DATETIME2(7) = SYSUTCDATETIME();

    -- 1. Find the emp_hist_id to be affected
	SELECT
		@affect_emp_hist_id = d.emp_hist_id
    FROM 
		deleted d
    JOIN 
		inserted i 
	ON 
		d.emp_hist_id = i.emp_hist_id
    WHERE 
		i.valid_from >= d.valid_from 
	AND 
		i.valid_from < d.valid_to
    AND 
		d.tran_to = btd.fn_infinity()

    -- Backfill record
    INSERT INTO 
		btd.employee 
	(
	    emp_id, 
		dept_id,
		first_name,
		last_name,
		job_title, 
		hire_date,
		term_date,
	    valid_from, 
		valid_to, 
		tran_from, 
		tran_to
    )
    SELECT
        d.emp_id,
		d.dept_id,
		d.first_name,
		d.last_name,
		d.job_title, 
		d.hire_date,
		d.term_date,
        d.valid_from,
        i.valid_from,
        @now,
        btd.fn_infinity()
    FROM 
		deleted d
    JOIN 
		inserted i 
	ON 
		d.emp_hist_id = i.emp_hist_id
    WHERE 
        d.emp_hist_id = @affect_emp_hist_id
    AND 
		d.valid_from != i.valid_from;

    -- Close old version
    UPDATE 
		btd.employee
    SET 
		tran_to = @now
    WHERE
        emp_hist_id = @affect_emp_hist_id;

    -- Insert new version
    INSERT INTO 
		btd.employee 
	(
	    emp_id, 
		dept_id,
		first_name,
		last_name,
		job_title, 
		hire_date,
		term_date,
	    valid_from, 
		valid_to, 
		tran_from, 
		tran_to
    )
    SELECT
        i.emp_id,
		i.dept_id,
		i.first_name,
		i.last_name,
		i.job_title, 
		i.hire_date,
		i.term_date,
        i.valid_from,
        i.valid_to,
        @now,
        btd.fn_infinity()
    FROM
        inserted i
    WHERE
        i.emp_hist_id = @affect_emp_hist_id;
END;
GO

-- ============================================================
-- Department Getter Procedure
-- ============================================================
CREATE OR ALTER PROCEDURE 
	btd.get_department
    @dept_id    INT,
    @tran_date  DATETIME2(7) = NULL,
    @valid_date DATETIME2(7) = NULL
AS
BEGIN
    SET @valid_date = ISNULL(@valid_date, SYSUTCDATETIME());
    SET @tran_date = ISNULL(@tran_date, SYSUTCDATETIME());

    SELECT 
        @tran_date AS tran_date,
        @valid_date AS valid_date,
        d.*
    FROM 
		btd.department d
    WHERE 
		d.dept_id = @dept_id
    AND 
		@valid_date >= d.valid_from 
	AND 
		@valid_date < d.valid_to
    AND 
		@tran_date >= d.tran_from 
	AND 
		@tran_date < d.tran_to;
END;
GO

-- ============================================================
-- Reset Data Procedure
-- ============================================================
CREATE OR ALTER PROCEDURE 
	btd.reset_data
AS 
BEGIN
    SET NOCOUNT ON;

    TRUNCATE TABLE btd.employee; -- resets identity
    TRUNCATE TABLE btd.department; -- resets identity
    DELETE FROM btd.department_master; -- can't truncate because of FK om btd.department
    
    -- Seed department master
    INSERT INTO 
		btd.department_master (dept_id)
    VALUES 
		(10),
		(20);

    -- Seed department history
    INSERT INTO 
		btd.department
    (
		dept_id, 
		dept_name, 
		location, 
		valid_from, 
		valid_to, 
		tran_from, 
		tran_to
	)
    VALUES
		(10, 'Sales', NULL, '2019-07-01', btd.fn_infinity(), '2019-06-01', '2021-06-01'), -- trans date ended

		(10, 'Sales', NULL, '2019-07-01', '2021-01-01', '2021-06-01', btd.fn_infinity()), -- back fill 
		(10, 'Sales & Marketing', NULL, '2021-01-01', btd.fn_infinity(), '2021-06-01', '2021-12-01'), -- new record, trans date ended

		(10, 'Sales & Marketing', NULL, '2021-01-01', '2022-01-01', '2021-12-01', btd.fn_infinity()), -- back fill 
		(10, 'Sales & BizDev', NULL, '2022-01-01', btd.fn_infinity(), '2021-12-01', btd.fn_infinity()), -- new record

		(20, 'Finance', NULL, '2019-01-01', btd.fn_infinity(), '2019-01-01', btd.fn_infinity());

    -- Seed employee history
    INSERT INTO 
		btd.employee
    (
		emp_id, 
		dept_id, 
		first_name, 
		last_name, 
		job_title, 
		hire_date, 
		term_date,
		valid_from, 
		valid_to, 
		tran_from, 
		tran_to
	)
    VALUES
    (100, 10, 'Alice', 'Smith', 'Sales Rep', '2017-01-01', null, '2019-07-01', btd.fn_infinity(), '2019-06-01', '2021-06-01'), -- original record, trans date ended

	(100, 10, 'Alice', 'Smith', 'Sales Rep', '2017-01-01', null, '2019-07-01', '2021-07-01', '2021-06-01', btd.fn_infinity()),  -- back fill 
	(100, 20, 'Alice', 'Smith', 'Controller', '2017-01-01', null, '2021-07-01', btd.fn_infinity(), '2021-06-01', '2022-06-01'), -- new record, trans date ended

    (100, 20, 'Alice', 'Smith', 'Controller', '2017-01-01', null, '2021-07-01', '2022-07-01', '2022-06-01', btd.fn_infinity()),  -- back fill 
    (100, 10, 'Alice', 'Smith', 'Head of Sales', '2017-01-01', null, '2022-07-01', btd.fn_infinity(), '2022-06-01', '2024-06-01'), -- new record

    (100, 10, 'Alice', 'Smith', 'Head of Sales', '2017-01-01', null, '2022-07-01', '2024-07-01', '2024-06-01', btd.fn_infinity()), -- back fill
    (100, 10, 'Alice', 'Smith-Jones', 'Head of Sales', '2017-01-01', null, '2024-07-01', btd.fn_infinity(), '2024-06-01', btd.fn_infinity()), -- new record

    (101, 10, 'Bob', 'Jones', 'Sales Rep', '2018-01-01', null, '2019-07-01', btd.fn_infinity(), '2019-06-01', btd.fn_infinity()), --original record

    (102, 10, 'Jerry', 'Leadbetter', 'Sales Rep', '2016-01-01', null, '2019-07-01', btd.fn_infinity(), '2019-06-01', '2023-01-01'), -- original record, trans date ended

    (102, 10, 'Jerry', 'Leadbetter', 'Sales Rep', '2016-01-01', null, '2019-07-01', '2023-01-01', '2023-01-01', btd.fn_infinity()), -- back fill
    (102, 10, 'Jerry', 'Leadbetter', 'Sales Rep', '2016-01-01', '2023-01-01', '2023-01-01', btd.fn_infinity(), '2023-01-01', btd.fn_infinity()); -- new record

END;
GO

-- Seed data
EXEC btd.reset_data;
GO

-- Extended functionality 
CREATE OR ALTER FUNCTION btd.fn_as_of_employee
(
    @valid_date DATETIME2(7),
    @tran_date  DATETIME2(7)
)
RETURNS TABLE
AS
RETURN
(
    SELECT *
    FROM btd.employee
    WHERE @valid_date >= valid_from
      AND @valid_date < valid_to
      AND @tran_date >= tran_from
      AND @tran_date < tran_to
);
GO

CREATE OR ALTER FUNCTION btd.fn_as_of_department
(
    @valid_date DATETIME2(7),
    @tran_date  DATETIME2(7)
)
RETURNS TABLE
AS
RETURN
(
    SELECT *
    FROM btd.department
    WHERE @valid_date >= valid_from
      AND @valid_date < valid_to
      AND @tran_date >= tran_from
      AND @tran_date < tran_to
);
GO
