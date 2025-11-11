<script lang="ts">
	import { Printer, Building } from 'lucide-svelte';
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

	let { ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root collapsible="offcanvas" {...restProps}>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton class="data-[slot=sidebar-menu-button]:!p-1.5">
					{#snippet child({ props })}
						<a href="/" {...props}>
							<PrinterIcon class="!size-5 text-red-600" />
							<span class="text-base font-semibold">Intersul cópias - Gestão</span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMain items={data.navMain} />
		<NavMain items={data.navAdmin} />
	</Sidebar.Content>
</Sidebar.Root>
