/**
 * Toast message constants in Portuguese
 */

export const TOAST_MESSAGES = {
	// Success messages
	serviceCreated: () => 'Serviço criado com sucesso!',
	serviceUpdated: () => 'Serviço atualizado com sucesso!',
	serviceDeleted: (name: string) => `Serviço "${name}" excluído com sucesso!`,
	
	clientCreated: () => 'Cliente criado com sucesso!',
	clientUpdated: () => 'Cliente atualizado com sucesso!',
	clientDeleted: (name: string) => `Cliente "${name}" excluído com sucesso!`,
	
	categoryCreated: () => 'Categoria criada com sucesso!',
	categoryUpdated: () => 'Categoria atualizada com sucesso!',
	categoryDeleted: (name: string) => `Categoria "${name}" excluída com sucesso!`,
	
	userCreated: () => 'Usuário criado com sucesso!',
	userUpdated: () => 'Usuário atualizado com sucesso!',
	userDeleted: (name: string) => `Usuário "${name}" excluído com sucesso!`,
	
	machineCreated: () => 'Máquina criada com sucesso!',
	machineUpdated: () => 'Máquina atualizada com sucesso!',
	machineDeleted: (name: string) => `Máquina "${name}" excluída com sucesso!`,
	
	stepCreated: () => 'Passo criado com sucesso!',
	stepUpdated: () => 'Passo atualizado com sucesso!',
	stepDeleted: (name: string) => `Passo "${name}" excluído com sucesso!`,
	
	// Error messages
	validation: (field: string) => `Erro de validação: ${field}`,
	fetch: (resource: string) => `Erro ao carregar ${resource}`,
	create: (resource: string) => `Erro ao criar ${resource}`,
	update: (resource: string) => `Erro ao atualizar ${resource}`,
	delete: (resource: string) => `Erro ao excluir ${resource}`,
	network: () => 'Erro de conexão. Verifique sua internet.',
	unauthorized: () => 'Sessão expirada. Faça login novamente.',
	forbidden: () => 'Você não tem permissão para esta ação.',
	notFound: () => 'Recurso não encontrado.',
	server: () => 'Erro interno do servidor. Tente novamente.',
	unknown: () => 'Erro desconhecido. Tente novamente.',
} as const;
