package com.local.dashboard.repository;

import com.local.dashboard.entity.OneStepCloserDepositHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OneStepCloserDepositRepository extends JpaRepository<OneStepCloserDepositHistory, Long> {
}
