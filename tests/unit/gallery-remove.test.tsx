import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, replace: vi.fn(), push: vi.fn() }) }));

import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import type { GalleryItem } from "@/lib/gallery";

const UP_ID = "00000000-0000-4000-8000-0000000000aa";
const item = (id: string, title: string, kind: GalleryItem["kind"] = "Colour"): GalleryItem => ({ id, title, caption: title, kind, src: `/images/models/${id}.webp`, width: 800, height: 600, alt: title });
const ITEMS = [item("r15-v4-1", "R15 V4, Racing Blue"), item("r15-v4-2", "R15 V4, Metallic Red"), item("mt-15-v2-1", "MT-15 V2, Ice Storm"), item(`upload-${UP_ID}`, "My upload", "Photo")];

const fetchMock = vi.fn();
beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  refresh.mockReset();
  // jsdom lacks these browser APIs
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: false, media: q, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(), onchange: null, dispatchEvent: vi.fn() }));
  vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } });
  // jsdom has no <dialog> support: give it the two methods the modal uses
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) { this.removeAttribute("open"); this.dispatchEvent(new Event("close")); };
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const ok = () => fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
const removeButtons = () => screen.queryAllByRole("button", { name: /^Remove photo:/ });

describe("remove buttons", () => {
  it("are not drawn for ordinary visitors", () => {
    render(<GalleryGrid items={ITEMS} />);
    expect(removeButtons()).toHaveLength(0);
    expect(screen.queryByText(/remove this photo/i)).toBeNull();
  });

  it("are drawn on every photo when the server says the visitor is the owner", () => {
    render(<GalleryGrid items={ITEMS} canRemove />);
    expect(removeButtons()).toHaveLength(ITEMS.length);
  });

  it("do nothing until the owner confirms", () => {
    render(<GalleryGrid items={ITEMS} canRemove />);
    fireEvent.click(removeButtons()[0]!);
    expect(screen.getByText("Remove this photo?")).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(removeButtons()).toHaveLength(ITEMS.length);
  });
});

describe("removing a built-in photo", () => {
  it("calls the protected hide endpoint, drops the photo from the page and refreshes the server data", async () => {
    ok();
    render(<GalleryGrid items={ITEMS} canRemove />);
    fireEvent.click(screen.getByRole("button", { name: "Remove photo: R15 V4, Metallic Red" }));
    expect(screen.getByText(/taken off the public gallery for everyone/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Remove photo" }));
    await waitFor(() => expect(removeButtons()).toHaveLength(ITEMS.length - 1));
    expect(screen.queryByRole("button", { name: "Remove photo: R15 V4, Metallic Red" })).toBeNull();
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/admin/gallery/hide");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ itemId: "r15-v4-2" });
    expect(refresh).toHaveBeenCalled();
  });
});

describe("removing an uploaded photo", () => {
  it("calls the delete endpoint with its database id", async () => {
    ok();
    render(<GalleryGrid items={ITEMS} canRemove />);
    fireEvent.click(screen.getByRole("button", { name: "Remove photo: My upload" }));
    expect(screen.getByText(/deleted from the website and from storage/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Remove photo" }));
    await waitFor(() => expect(removeButtons()).toHaveLength(ITEMS.length - 1));
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(`/api/admin/gallery/${UP_ID}`);
    expect(init.method).toBe("DELETE");
  });
});

describe("when the server refuses", () => {
  it("keeps the photo and explains an ended owner session", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: { code: "UNAUTHENTICATED", message: "Sign in to continue." } }), { status: 401 }));
    render(<GalleryGrid items={ITEMS} canRemove />);
    fireEvent.click(removeButtons()[0]!);
    fireEvent.click(screen.getByRole("button", { name: "Remove photo" }));
    await waitFor(() => expect(screen.getByText(/owner session has ended/i)).toBeTruthy());
    expect(removeButtons()).toHaveLength(ITEMS.length); // nothing disappeared from the page
    expect(refresh).not.toHaveBeenCalled();
  });

  it("shows the server's message for other failures (for example the migration is pending)", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: { code: "MIGRATION_PENDING", message: "Run supabase/migrations/0003_gallery_hidden.sql first." } }), { status: 503 }));
    render(<GalleryGrid items={ITEMS} canRemove />);
    fireEvent.click(removeButtons()[0]!);
    fireEvent.click(screen.getByRole("button", { name: "Remove photo" }));
    await waitFor(() => expect(screen.getByText(/0003_gallery_hidden/)).toBeTruthy());
    expect(removeButtons()).toHaveLength(ITEMS.length);
  });
});
