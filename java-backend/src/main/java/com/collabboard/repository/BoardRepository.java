package com.collabboard.repository;

import com.collabboard.entity.Board;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BoardRepository extends JpaRepository<Board, String> {
    List<Board> findAllByWorkspaceIdOrderByCreatedAtAsc(String workspaceId);
}