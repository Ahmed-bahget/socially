import Link from 'next/link';
import { DesktopNav } from './DesktopNav';
import { MobileNav } from './MobileNav';
import { currentUser } from '@clerk/nextjs/server';
import { syncUser } from '@/actions/user.actions';

export const Navbar = async () => {
    const user = await currentUser();
    let userData = null;
    
    if(user) {  
        userData = await syncUser();
    }

    return (
        <nav className='sticky top-0 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-backgroud/60 z-50'>
            <div className='max-w-7xl mx-auto px-4'>
                <div className='flex items-center justify-between h-16'>
                    <div className='items-center'>
                        <Link href="/" className='text-xl font-bold font-serif text-primary tracking-wider'>
                            Socially
                        </Link>
                    </div>

                    <DesktopNav username={userData?.username ?? ""} />
                    <MobileNav username={userData?.username ?? ""} />
                </div>
            </div>
        </nav>
    )
}