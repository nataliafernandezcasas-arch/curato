"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { COUNTRIES } from "@/lib/constants";

/**
 * Pair of inputs for collecting country + phone number with E.164 formatting.
 *
 * - `countryName` hidden input carries the selected country ISO code (e.g. "CO").
 * - `phoneName` hidden input carries the full phone in E.164-ish format: "+57 300 123 4567".
 * - The visible phone text field holds only the local part; the user-facing prefix
 *   comes from the country dropdown but stays editable via re-selecting a country.
 *
 * Defaults to Colombia because the pilot launches there first.
 */
type Props = {
  countryName: string;
  phoneName: string;
  defaultCountryCode?: string;
  required?: boolean;
  labelCountry?: string;
  labelPhone?: string;
  inputClass?: string;
  labelClass?: string;
};

export default function CountryPhoneInput({
  countryName,
  phoneName,
  defaultCountryCode = "CO",
  required,
  labelCountry = "País *",
  labelPhone = "WhatsApp *",
  inputClass = "",
  labelClass = "",
}: Props) {
  const defaultIdx = useMemo(
    () => Math.max(0, COUNTRIES.findIndex((c) => c.code === defaultCountryCode)),
    [defaultCountryCode],
  );
  const [country, setCountry] = useState(COUNTRIES[defaultIdx]);
  const [phoneLocal, setPhoneLocal] = useState("");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside.
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Focus the search box when opening the dropdown.
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 10);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.dialCode.includes(q) || c.code.toLowerCase().includes(q),
    );
  }, [query]);

  // Full E.164 value we submit with the form.
  const fullPhone = phoneLocal.trim() ? `+${country.dialCode} ${phoneLocal.trim()}` : "";

  return (
    <>
      {/* Country dropdown */}
      <div ref={rootRef} className="relative">
        <label className={labelClass}>{labelCountry}</label>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`${inputClass} flex items-center justify-between gap-2 text-left`}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="flex items-center gap-2.5 min-w-0">
            <span className="text-lg leading-none">{country.flag}</span>
            <span className="truncate">{country.name}</span>
            <span className="text-text-muted text-xs shrink-0">+{country.dialCode}</span>
          </span>
          <CaretDown size={14} weight="bold" className={`text-text-muted transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute z-20 mt-1.5 w-full rounded-lg border border-border bg-surface shadow-[0_12px_40px_-12px_rgba(38,33,63,0.18)] overflow-hidden">
            <div className="p-2 border-b border-border">
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar país o código…"
                className="w-full px-3 py-2 rounded-md border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
            <ul role="listbox" className="max-h-64 overflow-y-auto py-1 text-sm">
              {filtered.length === 0 && (
                <li className="px-4 py-3 text-text-muted text-xs">Sin resultados</li>
              )}
              {filtered.map((c) => (
                <li
                  key={c.code}
                  role="option"
                  aria-selected={c.code === country.code}
                  onClick={() => {
                    setCountry(c);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`flex items-center gap-2.5 px-4 py-2 cursor-pointer transition-colors ${
                    c.code === country.code ? "bg-accent/8 text-text-primary" : "hover:bg-border/40"
                  }`}
                >
                  <span className="text-lg leading-none">{c.flag}</span>
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="text-text-muted text-xs">+{c.dialCode}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Submitted value: ISO country code */}
        <input type="hidden" name={countryName} value={country.code} />
      </div>

      {/* Phone input */}
      <div>
        <label className={labelClass}>{labelPhone}</label>
        <div className={`${inputClass} flex items-center gap-0 p-0 overflow-hidden`}>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 pl-4 pr-3 py-3 text-sm text-text-muted shrink-0 hover:text-text-primary transition-colors border-r border-border/60"
            aria-label="Cambiar código de país"
          >
            <span className="text-base leading-none">{country.flag}</span>
            <span>+{country.dialCode}</span>
          </button>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            required={required}
            value={phoneLocal}
            onChange={(e) => setPhoneLocal(e.target.value.replace(/[^\d\s-]/g, ""))}
            placeholder="300 123 4567"
            className="flex-1 pl-3 pr-4 py-3 bg-transparent text-sm text-text-primary focus:outline-none"
          />
        </div>
        {/* Submitted value: full international number */}
        <input type="hidden" name={phoneName} value={fullPhone} />
      </div>
    </>
  );
}
