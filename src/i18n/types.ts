export type Dictionary = {
  app: {
    name: string;
    organization: string;
  };
  nav: {
    dashboard: string;
    documents: string;
    verification: string;
    masterData: string;
    masterDataDocuments: string;
    masterDataEmployees: string;
    masterDataCategories: string;
    security: string;
    settings: string;
    menu: string;
  };
  masterData: {
    categories: {
      pageTitle: string;
      pageDescription: string;
      addMaster: string;
      statusAndGroup: string;
      professionAndPosition: string;
      rankAndGrade: string;
      workplace: string;
      emptyEmploymentStatus: string;
      emptyEmployeeGroup: string;
      emptyProfessionGroup: string;
      emptyEmployeePosition: string;
      emptyRank: string;
      emptyWorkplace: string;
      typeLabel: string;
      typePlaceholder: string;
      createDescription: string;
      editDescription: string;
      saveCreateSuccess: string;
      saveUpdateSuccess: string;
    };
  };
};
