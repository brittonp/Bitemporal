using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;
using System.Text;
using System.Text.Json;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace Bitemporal.Data
{

    public interface ISqlData
    {

        Task<object> PingDatabase();
        Task<object> GetDepartmentBitemporalData(int deptId);
        Task<object> GetEmployeeBitemporalData(int empId);
        Task<object> GetData(DateTime validDate, DateTime tranDate);
        Task<int> ResetData();
        Task<int> UpdateData(string cmdName);
    }

    public class SqlData : ISqlData
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<SqlData> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;

        private string? _connectionString;

        public SqlData(
            IConfiguration configuration,
            ILogger<SqlData> logger,
            IHttpContextAccessor httpContextAccessor
            ) 
        {
            _configuration = configuration;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
            _connectionString = _configuration["ConnectionStrings:BitemporalDb"];
        }

        public async Task<object> PingDatabase()
        {
            var strBuilder = new StringBuilder();
            int i = 0;

            try
            {
                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    conn.Open();
                    string? sql = _configuration["Sql:PingDatabase"];
                    using SqlCommand sqlCmd = new SqlCommand(sql, conn);
                    try
                    {
                        var reader = await sqlCmd.ExecuteReaderAsync();
                        if (!reader.HasRows)
                        {
                            strBuilder.Append("[]");
                        }
                        else
                        {
                            while (reader.Read())
                            {
                                strBuilder.Append(reader.GetValue(0).ToString());
                                i++;
                            }
                        }
                    }
                    catch (SqlException ex)
                    {
                        _logger.LogError(999, ex, "SqlException on pinging database.");

                        return new
                        {
                            connectionString = _connectionString,
                            message = ex.Message,
                            errorCode = ex.ErrorCode,
                            errorSource = ex.Source
                        };
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(999, ex, "Exception on pinging database.");
                        return new
                        {
                            connectionString = _connectionString,
                            message = ex.Message,
                            errorSource = ex.Source
                        };
                    }
                    finally
                    {
                        _logger.LogInformation(999, "Retrieved recent session records: {0}.", i);
                    }
                }

            }
            catch (Exception ex)
            {
                _logger.LogError(999, ex, "Exception on connecting to database.");
                return new
                {
                    connectionString = _connectionString,
                    message = ex.Message,
                    errorSource = ex.Source
                };
            }

            var json = JsonSerializer.Deserialize<object>(strBuilder.ToString());
            return json ?? new object();
        }

        public async Task<object> GetDepartmentBitemporalData(int deptId)
        {
            var strBuilder = new StringBuilder();
            int i = 0;

            try
            {
                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    conn.Open();
                    string? sql = _configuration["Sql:Department"];
                    using SqlCommand sqlCmd = new SqlCommand(sql, conn);
                    sqlCmd.Parameters.AddWithValue("@deptId", deptId);
                    try
                    {
                        var reader = await sqlCmd.ExecuteReaderAsync();
                        if (!reader.HasRows)
                        {
                            strBuilder.Append("[]");
                        }
                        else
                        {
                            while (reader.Read())
                            {
                                strBuilder.Append(reader.GetValue(0).ToString());
                                i++;
                            }
                        }
                    }
                    catch (SqlException ex)
                    {
                        _logger.LogError(999, ex, "SqlException on getting parameter record.");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(999, ex, "Exception on getting parameter record.");
                    }
                    finally
                    {
                        _logger.LogInformation(999, "Retrieved data for deptId: {0}.", deptId);
                    }
                }

            }
            catch (Exception ex)
            {
                _logger.LogError(999, ex, "Exception on connecting to database.");
            }

            var json = JsonSerializer.Deserialize<object>(strBuilder.ToString());
            return json ?? new object();
        }

        public async Task<object> GetData(DateTime validDate, DateTime tranDate)
        {
            var strBuilder = new StringBuilder();
            int i = 0;

            try
            {
                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    conn.Open();
                    string? sql = _configuration["Sql:Query"];
                    using SqlCommand sqlCmd = new SqlCommand(sql, conn);
                    sqlCmd.Parameters.AddWithValue("@valid_date", validDate);
                    sqlCmd.Parameters.AddWithValue("@tran_date", tranDate);
                    try
                    {
                        var reader = await sqlCmd.ExecuteReaderAsync();
                        if (!reader.HasRows)
                        {
                            strBuilder.Append("[]");
                        }
                        else
                        {
                            while (reader.Read())
                            {
                                strBuilder.Append(reader.GetValue(0).ToString());
                                i++;
                            }
                        }
                    }
                    catch (SqlException ex)
                    {
                        _logger.LogError(999, ex, "SqlException on getting data.");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(999, ex, "Exception on getting data.");
                    }
                    finally
                    {
                        _logger.LogInformation(999, "Retrieved data for valdDate: {0}, tranData: {1}.", validDate, tranDate);
                    }
                }

            }
            catch (Exception ex)
            {
                _logger.LogError(999, ex, "Exception on connecting to database.");
            }

            var json = JsonSerializer.Deserialize<object>(strBuilder.ToString());
            return json ?? new object();
        }

        public async Task<object> GetEmployeeBitemporalData(int empId)
        {
            var strBuilder = new StringBuilder();
            int i = 0;

            try
            {
                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    conn.Open();
                    string? sql = _configuration["Sql:Employee"];
                    using SqlCommand sqlCmd = new SqlCommand(sql, conn);
                    sqlCmd.Parameters.AddWithValue("@empId", empId);
                    try
                    {
                        var reader = await sqlCmd.ExecuteReaderAsync();
                        if (!reader.HasRows)
                        {
                            strBuilder.Append("[]");
                        }
                        else
                        {
                            while (reader.Read())
                            {
                                strBuilder.Append(reader.GetValue(0).ToString());
                                i++;
                            }
                        }
                    }
                    catch (SqlException ex)
                    {
                        _logger.LogError(999, ex, "SqlException on getting parameter record.");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(999, ex, "Exception on getting parameter record.");
                    }
                    finally
                    {
                        _logger.LogInformation(999, "Retrieved data for empId: {1}.", empId);
                    }
                }

            }
            catch (Exception ex)
            {
                _logger.LogError(999, ex, "Exception on connecting to database.");
            }

            var json = JsonSerializer.Deserialize<object>(strBuilder.ToString());
            return json ?? new object();
        }

        public async Task<int> ResetData()
        {
            int rowsAffected = 0;

            string? sql = _configuration["Sql:ResetData"];

            try
            {
                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    conn.Open();
                    using SqlCommand sqlCmd = new SqlCommand(sql, conn);
                    try
                    {
                        rowsAffected = await sqlCmd.ExecuteNonQueryAsync();
                    }
                    catch (SqlException ex)
                    {
                        _logger.LogError(999, ex, "SqlException on resetting data.");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(999, ex, "Exception on resetting data.");
                    }
                    finally
                    {
                        _logger.LogWarning(999, "Data Reset");
                    }
                }

            }
            catch (Exception ex)
            {
                _logger.LogError(999, ex, "Exception on connecting to database.");
            }

            return rowsAffected;

        }

        public async Task<int> UpdateData(string cmdName)
        {
            int rowsAffected = 0;

            string? sql = _configuration[$"Sql:UpdateCmds:{cmdName}:sql"];

            try
            {
                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    conn.Open();
                    using SqlCommand sqlCmd = new SqlCommand(sql, conn);
                    try
                    {
                        rowsAffected = await sqlCmd.ExecuteNonQueryAsync();
                    }
                    catch (SqlException ex)
                    {
                        _logger.LogError(999, ex, "SqlException on updating data.");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(999, ex, "Exception on updating data.");
                    }
                    finally
                    {
                        _logger.LogWarning(999, "Data updated");
                    }
                }

            }
            catch (Exception ex)
            {
                _logger.LogError(999, ex, "Exception on connecting to database.");
            }

            return rowsAffected;

        }

    }
}

