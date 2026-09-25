package com.collabboard.dto.response;

import com.collabboard.entity.Board;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;
import java.util.List;

@Value
@Builder
public class BoardDetailResponse {
    String id;
    String name;
    String workspaceId;
    Instant createdAt;
    List<ListResponse> lists;

    public static BoardDetailResponse from(Board b, List<ListResponse> lists) {
        return BoardDetailResponse.builder()
                .id(b.getId())
                .name(b.getName())
                .workspaceId(b.getWorkspace().getId())
                .createdAt(b.getCreatedAt())
                .lists(lists)
                .build();
    }
}