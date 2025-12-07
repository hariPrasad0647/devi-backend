"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiLogOut } from "react-icons/fi";
import { Rubik_Glitch } from "next/font/google";

const rubikGlitch = Rubik_Glitch({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const ROW_BASE =
  "group flex items-center justify-start gap-3 py-3 pl-5 pr-4 rounded-md w-[88%] mx-auto min-h-[44px] transition-colors duration-150";
const ICON_BOX = "w-7 h-7 flex items-center justify-center shrink-0";
const LABEL = "whitespace-nowrap leading-none text-[17px]";

export default function Sidebar() {
  const pathnameRaw = usePathname();

  // ---------- normalize helper ----------
  function normalizePath(p) {
    if (!p) return "/";
    if (!p.startsWith("/")) p = `/${p}`;
    if (p !== "/" && p.endsWith("/")) return p.slice(0, -1);
    return p;
  }

  const pathname = normalizePath(pathnameRaw);

  // ========== NAV ITEMS ==========
  const navItems = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="34" viewBox="0 0 28 34" fill="none">
          <path d="M3.5 12.4091L14 2.75757L24.5 12.4091V27.5758C24.5 28.3071 24.2542 29.0085 23.8166 29.5257C23.379 30.0428 22.7855 30.3333 22.1667 30.3333H5.83333C5.21449 30.3333 4.621 30.0428 4.18342 29.5257C3.74583 29.0085 3.5 28.3071 3.5 27.5758V12.4091Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10.5 30.3333V16.5455H17.5V30.3333" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M14.4317 10.36H20.5567" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7.44334 10.36L8.31834 11.235L10.9433 8.61" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14.4317 18.5267H20.5567" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7.44334 18.5267L8.31834 19.4017L10.9433 16.7767" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10.5 25.6667H17.5C23.3333 25.6667 25.6667 23.3333 25.6667 17.5V10.5C25.6667 4.66666 23.3333 2.33333 17.5 2.33333H10.5C4.66667 2.33333 2.33334 4.66666 2.33334 10.5V17.5C2.33334 23.3333 4.66667 25.6667 10.5 25.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      label: "Orders",
      href: "/Orders",
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="21" height="23" viewBox="0 0 21 23" fill="none">
          <circle cx="10.5" cy="6.5" r="3.75" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M2 21v-1.2c0-4.2 3.8-7.6 8.5-7.6s8.5 3.4 8.5 7.6V21"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      ),
      label: "Reviews",
      href: "/Reviews",
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none">
          <path d="M21.25 24.375C21.25 22.3038 18.4512 20.625 15 20.625C11.5488 20.625 8.75 22.3038 8.75 24.375M26.25 20.625C26.25 19.0875 24.7075 17.7663 22.5 17.1875M3.75 20.625C3.75 19.0875 5.2925 17.7663 7.5 17.1875M22.5 12.17C22.8703 11.8426 23.1723 11.4452 23.3885 11.0008C23.6047 10.5563 23.7309 10.0734 23.7598 9.57995C23.7887 9.08651 23.7198 8.59222 23.5571 8.1255C23.3943 7.65878 23.1408 7.22885 22.8113 6.86043C22.4818 6.49201 22.0826 6.19238 21.6369 5.97876C21.1911 5.76514 20.7076 5.64175 20.214 5.61569C19.7204 5.58963 19.2265 5.66141 18.7607 5.8269C18.2949 5.99239 17.8665 6.24834 17.5 6.58M7.5 12.17C6.76537 11.5052 6.3237 10.5767 6.27146 9.58725C6.21922 8.59784 6.56066 7.62797 7.2212 6.88949C7.88173 6.15101 8.80768 5.70395 9.79676 5.64596C10.7859 5.58797 11.7577 5.92377 12.5 6.58M15 16.875C14.0054 16.875 13.0516 16.4799 12.3483 15.7767C11.6451 15.0734 11.25 14.1196 11.25 13.125C11.25 12.1304 11.6451 11.1766 12.3483 10.4734C13.0516 9.77009 14.0054 9.375 15 9.375C15.9946 9.375 16.9484 9.77009 17.6517 10.4734C18.3549 11.1766 18.75 12.1304 18.75 13.125C18.75 14.1196 18.3549 15.0734 17.6517 15.7767C16.9484 16.4799 15.9946 16.875 15 16.875Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
      label: "Customers",
      href: "/Customers",
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none">
          <path d="M11.25 16.25C14.0114 16.25 16.25 14.0114 16.25 11.25C16.25 8.48858 14.0114 6.25 11.25 6.25C8.48858 6.25 6.25 8.48858 6.25 11.25C6.25 14.0114 8.48858 16.25 11.25 16.25Z" stroke="currentColor" strokeWidth="2" />
          <path d="M20 23.75C20 19.6075 16.0825 16.25 11.25 16.25C6.4175 16.25 2.5 19.6075 2.5 23.75M18.75 16.25C19.5855 16.25 20.4076 16.0406 21.1413 15.6409C21.8751 15.2413 22.4969 14.6642 22.9501 13.9623C23.4033 13.2604 23.6735 12.4562 23.7358 11.623C23.7981 10.7899 23.6507 9.95437 23.3069 9.19288C22.9632 8.43138 22.4341 7.76816 21.768 7.26381C21.102 6.75946 20.3201 6.43006 19.494 6.3057C18.6678 6.18134 17.8236 6.26599 17.0386 6.55192C16.2535 6.83785 15.5527 7.31594 15 7.9425" stroke="currentColor" strokeWidth="2" />
        </svg>
      ),
      label: "Students",
      href: "/students",
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none">
          <path d="M11.25 16.25C14.0114 16.25 16.25 14.0114 16.25 11.25C16.25 8.48858 14.0114 6.25 11.25 6.25C8.48858 6.25 6.25 8.48858 6.25 11.25C6.25 14.0114 8.48858 16.25 11.25 16.25Z" stroke="currentColor" strokeWidth="2" />
          <path d="M20 23.75C20 19.6075 16.0825 16.25 11.25 16.25C6.4175 16.25 2.5 19.6075 2.5 23.75M18.75 16.25C19.5855 16.25 20.4076 16.0406 21.1413 15.6409C21.8751 15.2413 22.4969 14.6642 22.9501 13.9623C23.4033 13.2604 23.6735 12.4562 23.7358 11.623C23.7981 10.7899 23.6507 9.95437 23.3069 9.19288C22.9632 8.43138 22.4341 7.76816 21.768 7.26381C21.102 6.75946 20.3201 6.43006 19.494 6.3057C18.6678 6.18134 17.8236 6.26599 17.0386 6.55192C16.2535 6.83785 15.5527 7.31594 15 7.9425" stroke="currentColor" strokeWidth="2" />
        </svg>
      ),
      label: "MasterClass",
      href: "/masterClass",
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="19" height="24" viewBox="0 0 19 24" fill="none">
          <path d="M4.8599 0.127089L3.7844 0.451089C2.82676 0.739882 1.97156 1.29623 1.31943 2.05465C0.66731 2.81307 0.245412 3.74199 0.103396 4.73209C-0.342104 7.83409 0.653896 11.4611 3.0554 15.6206C5.4509 19.7696 8.0879 22.4426 10.9904 23.6126C11.923 23.9885 12.9439 24.0886 13.9317 23.9011C14.9196 23.7137 15.8328 23.2465 16.5629 22.5551L17.3759 21.7841C17.9038 21.2845 18.2324 20.6101 18.3005 19.8865C18.3687 19.1628 18.1718 18.439 17.7464 17.8496L15.7124 15.0296C15.4374 14.6489 15.0502 14.3638 14.605 14.2142C14.1598 14.0646 13.679 14.0581 13.2299 14.1956L10.1534 15.1361L10.0739 15.1511C9.7349 15.2006 8.95189 14.4671 7.97689 12.7781C6.95689 11.0111 6.7469 9.97759 7.0274 9.71059L8.5919 8.25109C9.16344 7.7174 9.55385 7.01839 9.7085 6.25186C9.86315 5.48533 9.7743 4.68963 9.4544 3.97609L8.46139 1.76959C8.1628 1.1056 7.63294 0.572856 6.97059 0.270658C6.30823 -0.0315409 5.55709 -0.0825679 4.8599 0.127089ZM7.09639 2.38459L8.08639 4.59109C8.27852 5.01907 8.33207 5.49639 8.23955 5.9563C8.14703 6.41621 7.91307 6.8357 7.57039 7.15609L6.0014 8.61709C4.9964 9.56809 5.32939 11.1911 6.67939 13.5281C7.94839 15.7271 9.10639 16.8131 10.3514 16.6241L10.5374 16.5851L13.6694 15.6296C13.8191 15.5836 13.9795 15.5856 14.1279 15.6354C14.2764 15.6852 14.4056 15.7802 14.4974 15.9071L16.5314 18.7271C16.7444 19.0218 16.8431 19.3838 16.8091 19.7458C16.7752 20.1078 16.6109 20.4451 16.3469 20.6951L15.5324 21.4661C15.0109 21.9596 14.3587 22.2931 13.6533 22.4268C12.9478 22.5606 12.2188 22.489 11.5529 22.2206C9.0059 21.1946 6.5984 18.7541 4.3559 14.8706C2.1074 10.9781 1.1969 7.66759 1.5884 4.94509C1.68974 4.23773 1.99107 3.57406 2.45692 3.03221C2.92277 2.49035 3.53374 2.09288 4.2179 1.88659L5.2934 1.56259C5.64208 1.45781 6.01698 1.48343 6.34817 1.63468C6.67935 1.78592 6.94423 2.05246 7.0934 2.38459" fill="white" />
        </svg>
      ),
      label: "1 on 1 call",
      href: "/one-on-one",
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M18.6667 10.5C18.6667 11.7377 18.175 12.9247 17.2998 13.7999C16.4247 14.675 15.2377 15.1667 14 15.1667C12.7623 15.1667 11.5753 14.675 10.7002 13.7999C9.82499 12.9247 9.33333 11.7377 9.33333 10.5C9.33333 9.26236 9.82499 8.07538 10.7002 7.20021C11.5753 6.32504 12.7623 5.83337 14 5.83337C15.2377 5.83337 16.4247 6.32504 17.2998 7.20021C18.175 8.07538 18.6667 9.26236 18.6667 10.5Z" fill="currentColor" />
          <path d="M14 1.16669C6.9125 1.16669 1.16666 6.91252 1.16666 14C1.16666 21.0875 6.9125 26.8334 14 26.8334C21.0875 26.8334 26.8333 21.0875 26.8333 14C26.8333 6.91252 21.0875 1.16669 14 1.16669Z" stroke="currentColor" strokeWidth="2" />
          <path d="M14 24.5C11.5896 24.5039 9.25183 23.6747 7.38266 22.1527C8.13494 21.0754 9.13639 20.1958 10.3018 19.5889C11.4671 18.9819 12.7619 18.6656 14.0758 18.6667C15.3734 18.6656 16.6524 18.974 17.8068 19.5665C18.9612 20.159 19.9575 21.0184 20.713 22.0734" stroke="currentColor" strokeWidth="2" />
        </svg>
      ),
      label: "Profile",
      href: "/profile",
    },
  ];

  return (
    <aside
      className="fixed left-0 top-0 h-screen bg-[#611F69] text-white flex flex-col justify-between shadow-lg"
      style={{ width: "var(--sidebar-w)" }}
      aria-label="Sidebar"
    >
      {/* Top */}
      <div className="pt-4 flex flex-col w-full">
        {/* Brand */}
        <div className="mb-3 w-full">
          <div className={`${ROW_BASE} cursor-default select-none`}>
            <span className={ICON_BOX}>
              {/* Static placeholder logo */}
              <svg xmlns="http://www.w3.org/2000/svg" width="46" height="49" viewBox="0 0 46 49" fill="none">
                <circle cx="23" cy="24.5" r="10" fill="#FFB71A" />
              </svg>
            </span>

            <span className={`${rubikGlitch.className} text-[20px] font-semibold`}>
              BrandName
            </span>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex flex-col w-full gap-1 mt-5" aria-label="Main navigation">
          {navItems.map((item) => {
            const hrefNorm = normalizePath(item.href);

            const isActive =
              pathname === hrefNorm ||
              (hrefNorm !== "/" && pathname.startsWith(hrefNorm + "/"));

            const itemClass = `${ROW_BASE} ${
              isActive
                ? "bg-white text-[#5B1A87] font-semibold"
                : "text-white hover:bg-[#6C2BD9]"
            }`;

            const iconColorClass = isActive
              ? "text-[#5B1A87]"
              : "text-white group-hover:text-[#611F69]";

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-full ${itemClass}`}
                aria-current={isActive ? "page" : undefined}
              >
                <span className={`${ICON_BOX} ${iconColorClass}`}>
                  {item.icon}
                </span>
                <span className={LABEL}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="pb-6 w-full">
        <button
          type="button"
          className={`${ROW_BASE} text-white cursor-pointer`}
          aria-label="Logout"
        >
          <span className={`${ICON_BOX} group-hover:text-[#611F69]`}>
            <FiLogOut size={18} />
          </span>
          <span className={LABEL}>Logout</span>
        </button>

        <p className="mt-6 text-white text-[14px] leading-[140%] text-center">
          © 2025 Devi Spicy Chiken Pickels
          <br />
          Powered by HanviTec Solutions
        </p>
      </div>
    </aside>
  );
}
