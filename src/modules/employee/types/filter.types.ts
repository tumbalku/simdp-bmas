export type EmployeeDirectoryFilterValues = {
  search: string;
  employmentStatusId: string;
  employeeGroupId: string;
  professionGroupId: string;
  employeePositionId: string;
  employeeRankId: string;
  workplaceId: string;
  maritalStatus: string;
  lastEducation: string;
  tmtStartDate: string;
  tmtEndDate: string;
  retirementAgeFrom: string;
  retirementAgeTo: string;
  status: string;
};

export type EmployeeFilterOption = {
  id: string;
  name: string;
};

export type EmployeeGroupOption = EmployeeFilterOption & {
  employmentStatusId: string;
};

export type EmployeePositionOption = EmployeeFilterOption & {
  professionGroupId: string;
};

export type EmployeeDirectoryFilterOptions = {
  employmentStatuses: EmployeeFilterOption[];
  employeeGroups: EmployeeGroupOption[];
  professionGroups: EmployeeFilterOption[];
  employeePositions: EmployeePositionOption[];
  employeeRanks: EmployeeFilterOption[];
  workplaces: EmployeeFilterOption[];
};
