export type Dictionary = {
  app: {
    name: string;
    organization: string;
  };
  nav: {
    dashboard: string;
    documents: string;
    verification: string;
    statistics: string;
    masterData: string;
    masterDataDocuments: string;
    masterDataEmployees: string;
    masterDataCategories: string;
    security: string;
    settings: string;
    systemSettings: string;
    menu: string;
  };
  navbar: {
    notifications: {
      open: string;
      title: string;
      unread: (count: number) => string;
      allRead: string;
      markAll: string;
      emptyTitle: string;
      emptyDescription: string;
    };
    profile: {
      login: string;
      profile: string;
      settings: string;
      logout: string;
    };
  };
  auth: {
    login: {
      eyebrow: string;
      title: string;
      description: string;
      helpText: string;
      resetPassword: string;
      identifierLabel: string;
      identifierPlaceholder: string;
      passwordLabel: string;
      passwordPlaceholder: string;
      processing: string;
      submit: string;
    };
    forgotPassword: {
      eyebrow: string;
      title: string;
      description: string;
      backToLogin: string;
      successMessage: string;
      emailLabel: string;
      emailPlaceholder: string;
      sending: string;
      submit: string;
    };
    resetPassword: {
      eyebrow: string;
      title: string;
      description: string;
      backToLogin: string;
      missingTokenTitle: string;
      missingTokenDescription: string;
      missingTokenAlert: string;
      requestNewLink: string;
      newPasswordLabel: string;
      newPasswordPlaceholder: string;
      confirmPasswordLabel: string;
      confirmPasswordPlaceholder: string;
      saving: string;
      submit: string;
    };
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
