using Bitemporal.Data;
using Microsoft.AspNetCore.Routing;

namespace Bitemporal.Api
{

    public interface IBitemporalData
    {
        Task<object> GetDepartmentBitemporalData(int deptId);
        Task<object> GetEmployeeBitemporalData(int empId);
        Task<object> GetData(DateTime validDate, DateTime tranDate);
        Task<object> ResetData();
        Task<object> UpdateData(string cmdName);
        object GetCmds();
    }

        public class BitemporalData : IBitemporalData
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<Session> _logger;
        private readonly ISqlData _sqlData;

        public BitemporalData(
            IConfiguration configuration,
            ILogger<Session> logger,
            ISqlData sqlData)
        {
            _configuration = configuration;
            _logger = logger;
            _sqlData = sqlData;
        }

        public async Task<object> GetDepartmentBitemporalData(int deptId)
        {
            var json = await _sqlData.GetDepartmentBitemporalData(deptId);
            
            return json;
        }

        public async Task<object> GetEmployeeBitemporalData(int empId)
        {
            var json = await _sqlData.GetEmployeeBitemporalData(empId);

            return json;
        }

        public async Task<object> GetData(DateTime validDate, DateTime tranDate)
        {
            var json = await _sqlData.GetData(validDate, tranDate);

            return json;
        }

        public async Task<object> ResetData()
        {
            // Query all session records...
            var rowsAffected = await _sqlData.ResetData();

            return new
            {
                rowsAffected = rowsAffected
            };
        }

        public async Task<object> UpdateData(string cmdName)
        {
            // Query all session records...
            var rowsAffected = await _sqlData.UpdateData(cmdName);

            return new
            {
                rowsAffected = rowsAffected
            };
        }

        public object GetCmds()
        {
            var sqlSection = _configuration?.GetSection("Sql");

            if (sqlSection == null)
                return null;

            return BindSection(sqlSection);
        }

        // Recursive helper
        private Dictionary<string, object> BindSection(IConfigurationSection section)
        {
            var dict = new Dictionary<string, object>();

            foreach (var child in section.GetChildren())
            {
                if (child.GetChildren().Any())
                {
                    // Nested object
                    dict[child.Key] = BindSection(child);
                }
                else
                {
                    // Leaf value
                    dict[child.Key] = child.Value;
                }
            }

            return dict;
        }


    }
}
