<script lang="ts">
	import DashboardIcon from "@tabler/icons-svelte/icons/dashboard";
	import DatabaseIcon from "@tabler/icons-svelte/icons/database";
	import FileAiIcon from "@tabler/icons-svelte/icons/file-ai";
	import FileDescriptionIcon from "@tabler/icons-svelte/icons/file-description";
	import FileWordIcon from "@tabler/icons-svelte/icons/file-word";
	import FolderIcon from "@tabler/icons-svelte/icons/folder";
	import HelpIcon from "@tabler/icons-svelte/icons/help";
	import InnerShadowTopIcon from "@tabler/icons-svelte/icons/inner-shadow-top";
	import ListDetailsIcon from "@tabler/icons-svelte/icons/list-details";
	import ReportIcon from "@tabler/icons-svelte/icons/report";
	import SearchIcon from "@tabler/icons-svelte/icons/search";
	import SettingsIcon from "@tabler/icons-svelte/icons/settings";
	import UsersIcon from "@tabler/icons-svelte/icons/users";
	import UserCheckIcon from "@tabler/icons-svelte/icons/user-check";
	import NavMain from "./nav-main.svelte";
	import PrinterIcon from "@tabler/icons-svelte/icons/printer";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import type { ComponentProps } from "svelte";
	import ListCheckIcon from "@tabler/icons-svelte/icons/list-check";
	import { userRole } from "$lib/stores/auth.svelte";
	import { UserRole } from "$lib/api/types/auth.types.js";

	const data = {
		navMain: [
			{
				title: "Dashboard",
				url: "/dashboard",
				icon: DashboardIcon,
			},
			{
				title: "Serviços",
				url: "/services",
				icon: ListCheckIcon,
			},
			{
				title: "Clientes",
				url: "/clients",
				icon: UsersIcon,
			},
			{
				title: "Máquinas",
				url: "/machines",
				icon: PrinterIcon,
			},
		],
		navAdmin: [
			{
				title: "Funcionários",
				url: "/admin/users",
				icon: UserCheckIcon,
			},
			{
				title: "Franquias",
				url: "/franchises",
				icon: FolderIcon,
			},
		],
		navSecondary: [
			{
				title: "Settings",
				url: "#",
				icon: SettingsIcon,
			},
			{
				title: "Get Help",
				url: "#",
				icon: HelpIcon,
			},
			{
				title: "Search",
				url: "#",
				icon: SearchIcon,
			},
		],
		documents: [
			{
				name: "Data Library",
				url: "#",
				icon: DatabaseIcon,
			},
			{
				name: "Reports",
				url: "#",
				icon: ReportIcon,
			},
			{
				name: "Word Assistant",
				url: "#",
				icon: FileWordIcon,
			},
		],
	};

	type NavAccessRule = {
		main: 'ALL' | string[];
		admin: 'ALL' | string[];
	};

	const NAV_ACCESS: Record<UserRole, NavAccessRule> = {
		[UserRole.ADMIN]: { main: 'ALL', admin: 'ALL' },
		[UserRole.MANAGER]: {
			main: 'ALL',
			admin: ['/franchises'],
		},
		[UserRole.COMMERCIAL]: {
			main: ['/dashboard', '/services', '/clients', '/machines'],
			admin: ['/franchises'],
		},
		[UserRole.TECHNICIAN]: {
			main: ['/dashboard', '/services', '/clients'],
			admin: [],
		},
	};

	let currentRole = $state<UserRole | null>(null);
	$effect(() => {
		const unsubscribe = userRole.subscribe((role) => {
			currentRole = role ?? null;
		});
		return unsubscribe;
	});

	function filterNavItems(
		items: { title: string; url: string; icon?: typeof DashboardIcon }[],
		rule: 'ALL' | string[],
	) {
		if (rule === 'ALL') return items;
		return items.filter((item) => rule.includes(item.url));
	}

	function getAccess(): NavAccessRule {
		if (!currentRole) {
			return NAV_ACCESS[UserRole.MANAGER];
		}
		return NAV_ACCESS[currentRole];
	}

	const navMainItems = $derived(() => {
		const access = getAccess();
		return filterNavItems(data.navMain, access.main);
	});

	const navAdminItems = $derived(() => {
		const access = getAccess();
		return filterNavItems(data.navAdmin, access.admin);
	});

	let { ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root collapsible="offcanvas" {...restProps}>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton class="data-[slot=sidebar-menu-button]:!p-1.5">
					{#snippet child({ props })}
						<a href="/dashboard" {...props}>
							<PrinterIcon class="!size-5 text-red-600" />
							<span class="text-base font-semibold">Intersul cópias - Gestão</span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		{#if navMainItems().length}
			<NavMain items={navMainItems()} />
		{/if}
		{#if navAdminItems().length}
			<NavMain items={navAdminItems()} />
		{/if}
	</Sidebar.Content>
</Sidebar.Root>
