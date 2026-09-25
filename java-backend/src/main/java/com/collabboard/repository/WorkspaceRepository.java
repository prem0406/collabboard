package com.collabboard.repository;

import com.collabboard.entity.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface WorkspaceRepository extends JpaRepository<Workspace, String> {

    @Query("select w from Workspace w join WorkspaceMember wm on wm.workspace = w " +
            "where wm.user.id = :userId order by w.createdAt desc")
    List<Workspace> findAllForUser(@Param("userId") String userId);
}