import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock process.env defaults for unit tests
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock-jnvst-project.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "dummy-anon-key";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
