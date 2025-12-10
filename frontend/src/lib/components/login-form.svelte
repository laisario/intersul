<script lang="ts">
	import PrinterIcon from "@lucide/svelte/icons/printer";
	import type { HTMLAttributes } from "svelte/elements";
	import {
		FieldGroup,
		Field,
		FieldLabel,
		FieldDescription,
		FieldSeparator,
		FieldError,
	} from "$lib/components/ui/field/index.js"
	import { Input } from "$lib/components/ui/input/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import logo from "$lib/assets/logo.png";
	import { useLogin } from "$lib/hooks/queries/use-auth.svelte.js";
	import { loginSchema, validateForm, getFieldError } from "$lib/utils/validation.js";
	import { errorToast, successToast, showError } from "$lib/utils/toast.js";
	import { goto } from '$app/navigation';
	import { Eye, EyeOff } from 'lucide-svelte';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();

	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let errors = $state<Record<string, string>>({});

	const { mutate: loginUser, isPending: isLoading } = useLogin();

	async function handleLogin(event: Event) {
		event.preventDefault();
		
		errors = {};

		const validation = validateForm(loginSchema, { email, password });
		if (!validation.success) {
			errors = validation.errors;
			return;
		}

		loginUser(
			{ email, password },
			{
				onSuccess: () => {
					successToast.loggedIn();
					goto('/');
				},
				onError: (error: any) => {
					console.error('Login failed:', error);
					console.error('Error response:', error.response);
					console.error('Error response data:', error.response?.data);
					
					// Get error message from backend
					let errorMessage = error.response?.data?.message || 
					                   error.message || 
					                   'Erro ao fazer login. Tente novamente.';
					
					// Translate common error messages to Portuguese
					if (errorMessage.toLowerCase().includes('invalid credentials')) {
						errorMessage = 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.';
					}
					
					// Show toast notification with backend error message
					showError(errorMessage);
				},
			}
		);
	}

	function togglePasswordVisibility() {
		showPassword = !showPassword;
	}
</script>

<div class={cn("bg-background flex flex-col gap-6  px-10 py-20 rounded-lg", className)} bind:this={ref} {...restProps}>
	<form onsubmit={handleLogin}>
		<FieldGroup>
			<div class="flex flex-col items-center gap-4 text-center">
				<a href="##" class="flex flex-col items-center gap-10 font-medium">
					<div class="flex size-auto items-center justify-center">
						<img src={logo} alt="Intersul Cópias" class="h-32 w-auto" />
					</div>
					<span class="sr-only">Intersul Cópias</span>
				</a>
				<h1 class="text-xl font-bold">Bem vindo companheiro(a)!</h1>
			</div>
			
			<Field>
				<FieldLabel for="email">Email</FieldLabel>
				<Input 
					id="email" 
					type="email" 
					placeholder="savinho.nascimento@example.com" 
					bind:value={email}
					class={getFieldError(errors, 'email') ? 'border-red-500' : ''}
					required 
				/>
				{#if getFieldError(errors, 'email')}
					<FieldError>{getFieldError(errors, 'email')}</FieldError>
				{/if}
			</Field>
			
			<Field>
				<FieldLabel for="password">Senha</FieldLabel>
				<div class="relative">
					<Input 
						id="password" 
						type={showPassword ? 'text' : 'password'}
						placeholder="Digite a sua senha" 
						bind:value={password}
						class="pr-10"
						required 
					/>
					<button
						type="button"
						onclick={togglePasswordVisibility}
						class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
						aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
					>
						{#if showPassword}
							<EyeOff class="w-4 h-4" />
						{:else}
							<Eye class="w-4 h-4" />
						{/if}
					</button>
				</div>
			</Field>
			
			<Field>
				<Button type="submit" disabled={isLoading} class="w-full bg-red-600 hover:bg-red-700 text-white">
					{isLoading ? 'Carregando...' : 'Entrar'}
				</Button>
			</Field>
		</FieldGroup>
	</form>
</div>
