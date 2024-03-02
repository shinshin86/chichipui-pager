const existingPaginator = document.querySelector(
  ".pagination-list",
) as HTMLElement;

// 既存のページャーから最大ページ数を取得
const lastPageLink = existingPaginator.querySelector("li:last-child a");
const maxPageNumber = parseInt(lastPageLink?.textContent ?? "", 10);

// 独自のページャーを生成
const customPaginator = document.createElement("ul");
customPaginator.className = "pagination-list";

for (let i = 1; i <= maxPageNumber; i++) {
  const listItem = document.createElement("li");
  listItem.style.marginBottom = "8px";
  const pageLink = document.createElement("a");
  pageLink.className = "pagination-link";
  pageLink.href = `?p=${i}`;
  pageLink.textContent = i.toString();

  // 現在表示中のページにはis-currentクラスを付与
  const currentUrl = new URL(window.location.href);
  const currentPage = currentUrl.searchParams.get("p");
  if (currentPage === String(i)) {
    pageLink.classList.add("is-current");
  }

  listItem.appendChild(pageLink);
  customPaginator.appendChild(listItem);
}

existingPaginator.replaceWith(customPaginator);