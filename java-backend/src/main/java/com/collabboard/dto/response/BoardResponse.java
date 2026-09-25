package com.collabboard.dto.response;

import com.collabboard.entity.Board;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;

@Value
@Builder
public class BoardResponse {
    String id;
    String name;
    String workspaceId;
    Instant createdAt;

    public static BoardResponse from(Board b) {
        return BoardResponse.builder()
                .id(b.getId())
                .name(b.getName())
                .workspaceId(b.getWorkspace().getId())
                .createdAt(b.getCreatedAt())
                .build();
    }
}