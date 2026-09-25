package com.collabboard.dto.response;

import com.collabboard.entity.Role;
import com.collabboard.entity.Workspace;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;

@Value
@Builder
public class WorkspaceResponse {
    String id;
    String name;
    Role myRole;
    Instant createdAt;

    public static WorkspaceResponse from(Workspace w, Role myRole) {
        return WorkspaceResponse.builder()
                .id(w.getId())
                .name(w.getName())
                .myRole(myRole)
                .createdAt(w.getCreatedAt())
                .build();
    }
}