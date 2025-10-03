export default function AdminFooter() {
    return (
        <footer className="bg-white border-t border-gray-200 py-4 mt-auto">
            <div className="px-4 sm:px-6 lg:px-8">
                <p
                    className="text-sm text-gray-500 text-center"
                    data-testid="footer-copyright"
                >
                    © {new Date().getFullYear()} Geek Sales. All rights reserved.
                </p>
            </div>
        </footer>
    );
}

