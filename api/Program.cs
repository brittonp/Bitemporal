using Scalar.AspNetCore;
using Bitemporal.Api;
using Bitemporal.Data;
using ISession = Bitemporal.Api.ISession;
using IBitemporalData = Bitemporal.Api.IBitemporalData;
using System.Diagnostics.CodeAnalysis;

var builder = WebApplication.CreateBuilder(args);

// Added as suggested in https://learn.microsoft.com/en-us/aspnet/core/fundamentals/dependency-injection?view=aspnetcore-7.0
builder.Services.AddHttpContextAccessor();
builder.Services.AddHttpClient();

builder.Services.AddTransient<ISqlData, SqlData>();
builder.Services.AddTransient<ISession, Session>();
builder.Services.AddTransient<IBitemporalData, BitemporalData>();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();

//logging 
builder.Logging
    .ClearProviders()
    .AddDebug()
    .AddEventLog(eventLogSettings =>
    {
        eventLogSettings.SourceName = "Bitemporal-api";
    })
    .AddAzureWebAppDiagnostics();

//  in-memory session provider, taken from https://learn.microsoft.com/en-us/aspnet/core/fundamentals/app-state?view=aspnetcore-7.0 ...
builder.Services.AddDistributedMemoryCache();

builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(60);
    options.Cookie.Name = ".Bitemporal-api.Session";
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

builder.Configuration.AddJsonFile("sqlCmds.json", optional: true, reloadOnChange: true);

builder.Services.AddOpenApi(options =>
{
    // This line is required because in dev (on IIS) the server is presented as http://*:port#, but * is not recognised.
    options.AddDocumentTransformer((document, context, cancellationToken) =>
    {
        document.Servers.Clear();
        return Task.CompletedTask;
    });
});

// CORS enablement
var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy",
        policy => policy
            .WithOrigins(allowedOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader());
});

var app = builder.Build();

app.UseCors("CorsPolicy");

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment() || app.Environment.IsStaging() || app.Environment.IsEnvironment("Test"))
{
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
        options
            .WithTheme(ScalarTheme.None)
            //.WithLayout(ScalarLayout.Classic)
            .WithDarkMode(false)
            .WithSidebar(true)
            .WithDotNetFlag(true)
    );

    app.UseHttpsRedirection();
}


// Bitemporal Api group...
var bitemporalGroup = app.MapGroup("/Bitemporal")
    .WithTags("Bitemporal");

bitemporalGroup.MapGet("/GetDepartmentBitemporalData", async (
        IBitemporalData bitemporaldata,
        int deptId = 10
    ) =>
{
    var result = await bitemporaldata.GetDepartmentBitemporalData(deptId);

    return Results.Json(result);

});

bitemporalGroup.MapGet("/GetEmployeeBitemporalData", async (
        IBitemporalData bitemporaldata,
        int deptId = 10,
        int empId = 100
    ) =>
{
    var result = await bitemporaldata.GetEmployeeBitemporalData(empId);

    return Results.Json(result);

});

bitemporalGroup.MapGet("/GetData", async (
        IBitemporalData bitemporaldata,
        DateTime? validDate,
        DateTime? tranDate
    ) =>
{
    DateTime now = DateTime.Now;
    DateTime vd = validDate ?? now;
    DateTime td = tranDate ?? now;

    var result = await bitemporaldata.GetData(vd, td);

    return Results.Json(result);
});

bitemporalGroup.MapGet("/ResetData", async (
        IBitemporalData bitemporaldata
    ) =>
{
    var rowsAffected = await bitemporaldata.ResetData();

    return Results.Json(rowsAffected);

});

bitemporalGroup.MapGet("/UpdateData/{cmdName}", async (
        IBitemporalData bitemporaldata,
        string cmdName = "UpdateDept1"
    ) =>
{
    var rowsAffected = await bitemporaldata.UpdateData(cmdName);

    return Results.Json(rowsAffected);

});


bitemporalGroup.MapGet("/GetCmds",  (
        IBitemporalData bitemporaldata
    ) =>
{
    var cmds = bitemporaldata.GetCmds();

    return Results.Json(cmds);

})
    .WithDescription("Get all SQL commands, (minimal api)");


// Session api group...
var sessionGroup = app.MapGroup("/GetUpdateCmds")
    .WithTags("Session");

sessionGroup.MapGet("/PingDatabase", async (ISession session) =>
{
    var result = await session.PingDatabase();
    return Results.Ok(result);

})
    .WithDescription("Ping the database and return information, (minimal api)");


app.Run();

