import { Pagination as P, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "./ui/pagination";


/**
 * Pagination component for navigating through paginated lists.
 * Renders page links, previous/next buttons, and ellipsis for large page sets.
 * Hides itself if the list is empty and on the first page.
 */
export default function Pagination({ list, page, totalPages, query="" }:
    { list: any[], page: number, totalPages: number, query?: string }) {
    return (
        <P className={`${list.length == 0 && page == 0 ? "hidden" : ""}`}>
            <PaginationContent>
                {totalPages == 1 ? (
                    <PaginationItem>
                        <PaginationLink href={`${query}&page=0`} isActive>1</PaginationLink>
                    </PaginationItem>
                ) : (
                    <>
                        {page > 0 && (
                            <PaginationItem>
                                <PaginationPrevious href={`${query}&page=` + (page - 1)} />
                            </PaginationItem>
                        )}
                        <PaginationItem>
                            <PaginationLink href={`${query}&page=` + 0} isActive={page == 0}>1</PaginationLink>
                        </PaginationItem>
                        {page <= 2 ? (
                            <PaginationItem>
                                <PaginationLink href={`${query}&page=` + 1} isActive={page == 1}>2</PaginationLink>
                            </PaginationItem>
                        ) : page != totalPages - 1 ? (
                            <PaginationItem>
                                <PaginationEllipsis />
                            </PaginationItem>
                        ) : <></>}
                        {totalPages == 3 && (
                            <PaginationItem>
                                <PaginationLink href={`${query}&page=` + 2} isActive={page == 2}>3</PaginationLink>
                            </PaginationItem>
                        )}
                        {totalPages > 3 && (
                            <>
                                {(page != totalPages - 1 && page >= 2) && (
                                    <PaginationItem>
                                        <PaginationLink href={`${query}&page=` + page} isActive>{page + 1}</PaginationLink>
                                    </PaginationItem>
                                )}
                                <PaginationItem>
                                    <PaginationEllipsis />
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationLink href={`${query}&page=` + (totalPages - 1)} isActive={page == totalPages - 1}>
                                        {totalPages}
                                    </PaginationLink>
                                </PaginationItem>
                            </>
                        )}
                        {page < totalPages - 1 && (
                            <PaginationItem>
                                <PaginationNext href={`${query}&page=` + (page + 1)} />
                            </PaginationItem>
                        )}
                    </>
                )}
            </PaginationContent>
        </P>
    );
}