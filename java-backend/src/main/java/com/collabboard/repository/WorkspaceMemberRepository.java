package com.collabboard.repository;

import com.collabboard.entity.Role;
import com.collabboard.entity.WorkspaceMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WorkspaceMemberRepository extends JpaRepository<WorkspaceMember, String> {

    Optional<WorkspaceMember> findByWorkspaceIdAndUserId(String workspaceId, String userId);

    List<WorkspaceMember> findAllByWorkspaceId(String workspaceId);

    boolean existsByWorkspaceIdAndUserId(String workspaceId, String userId);

    long countByWorkspaceIdAndRole(String workspaceId, Role role);
}