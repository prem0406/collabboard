package com.collabboard.dto.response;

import com.collabboard.entity.Role;
import com.collabboard.entity.WorkspaceMember;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;

@Value
@Builder
public class WorkspaceMemberResponse {
    String id;
    String userId;
    String name;
    String email;
    Role role;
    Instant joinedAt;

    public static WorkspaceMemberResponse from(WorkspaceMember m) {
        return WorkspaceMemberResponse.builder()
                .id(m.getId())
                .userId(m.getUser().getId())
                .name(m.getUser().getName())
                .email(m.getUser().getEmail())
                .role(m.getRole())
                .joinedAt(m.getCreatedAt())
                .build();
    }
}