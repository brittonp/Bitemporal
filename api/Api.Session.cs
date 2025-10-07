using Bitemporal.Data;
using Microsoft.AspNetCore.Routing;

namespace Bitemporal.Api
{

    public interface ISession
    {
        Task<object> PingDatabase();
    }

        public class Session: ISession
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<Session> _logger;
        private readonly ISqlData _sqlData;

        public Session(
            IConfiguration configuration,
            ILogger<Session> logger,
            ISqlData sqlData)
        {
            _configuration = configuration;
            _logger = logger;
            _sqlData = sqlData;
        }

        public async Task<object> PingDatabase()
        {
            // Ping database...
            var json = await _sqlData.PingDatabase();
            return json;
        }

    }
}
