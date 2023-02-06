import Link from 'next/link';

export const Header = () => {
  return (
    <header className="h-[72px] bg-corsha-brand-blue flex w-screen m-0 justify-start items-center border-b-2 border-b-green-700 px-16">
      <nav className="flex flex-1 mx-auto max-w-screen items-center">
        <ul>
          <li>
            <Link href="/" className="text-white">
              CAST
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};
