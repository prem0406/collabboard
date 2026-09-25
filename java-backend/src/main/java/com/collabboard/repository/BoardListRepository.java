package com.collabboard.repository;

import com.collabboard.entity.BoardList;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BoardListRepository extends JpaRepository<BoardList, String> {
    List<BoardList> findAllByBoardIdOrderByPositionAsc(String boardId);

    long countByBoardId(String boardId);
}