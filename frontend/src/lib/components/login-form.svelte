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
	import { errorToast, successToast } from "$lib/utils/toast.js";
	import { goto } from '$app/navigation';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();

	let email = $state('');
	let password = $state('');
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
					goto('/dashboard');
				},
				onError: (error: any) => {
					console.error('Login failed:', error);
					
					if (error.response?.status === 401) {
						errorToast.unauthorized();
					} else if (error.response?.status === 422) {
						const serverErrors = error.response.data?.errors || {};
						errors = serverErrors;
					} else {
						errorToast.unknown();
					}
				},
			}
		);
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
				<Input 
					id="password" 
					type="password" 
					placeholder="Digite a sua senha" 
					bind:value={password}
					class={getFieldError(errors, 'password') ? 'border-red-500' : ''}
					required 
				/>
				{#if getFieldError(errors, 'password')}
					<FieldError>{getFieldError(errors, 'password')}</FieldError>
				{/if}
			</Field>
			
			<Field>
				<Button type="submit" disabled={isLoading} class="w-full bg-red-600 hover:bg-red-700 text-white">
					{isLoading ? 'Carregando...' : 'Entrar'}
				</Button>
			</Field>
		</FieldGroup>
	</form>
</div>
