package com.local.dashboard.repository;

import com.local.dashboard.entity.OneStepCloserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface OneStepCloserRepository extends JpaRepository<OneStepCloserEntity, Long>, JpaSpecificationExecutor<OneStepCloserEntity> {
}
