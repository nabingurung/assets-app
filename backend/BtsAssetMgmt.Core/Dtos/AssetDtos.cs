using System;
using BtsAssetMgmt.Core.Entities;

namespace BtsAssetMgmt.Core.Dtos
{
    public record AddNoteRequest(string Content);

    public record AssetFilter(string? Search, int? CategoryId, int? LocationId, AssetStatus? Status);

    public record CurrentUser(Guid Id, string Username);
}
