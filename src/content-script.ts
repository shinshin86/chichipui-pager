let currentPopup: HTMLDivElement | null = null;

class TemporaryStorage<T> {
  private storage: Record<string, T>;

  constructor() {
    this.storage = {};
  }

  public setData(key: string, value: T): void {
    this.storage[key] = value;
  }

  public getData(key: string): T | undefined {
    return this.storage[key];
  }
}

const tempStorage = new TemporaryStorage<string>();

const parseTitleList = (html: Document): Array<string> => {
  const titleList: Array<string> = [];

  html.querySelectorAll(".column").forEach((column) => {
    if (!column) {
      return;
    }

    const imageTitle = column.querySelector("h3")?.textContent;
    if (!imageTitle) {
      return;
    }

    titleList.push(imageTitle);
  });

  // 最後の要素は不要なので削除
  titleList.pop();

  return titleList;
};

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

document.querySelectorAll<HTMLAnchorElement>(".pagination-link").forEach(
  (link: HTMLAnchorElement) => {
    link.addEventListener("mouseenter", function (event: MouseEvent) {
      const url: URL = new URL(link.href);
      const pageKey: string | null = url.searchParams.get("p");

      // すでに表示中のポップアップがあれば削除
      if (currentPopup) {
        document.body.removeChild(currentPopup);
        currentPopup = null;
      }

      if (pageKey && tempStorage.getData(pageKey)) {
        showPopup(
          event.clientX,
          event.clientY,
          tempStorage.getData(pageKey) || "",
        );
      } else {
        fetch(url)
          .then((response) => response.text())
          .then((html) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            const titleList = parseTitleList(doc);
            const stringifiedTitleList = JSON.stringify(titleList);
            tempStorage.setData(pageKey as string, stringifiedTitleList);
            showPopup(event.clientX, event.clientY, stringifiedTitleList);
          });
      }
    });
  },
);

// 遷移先のページタイトルをリスト形式のHTMLにして返す
const createList = (titleList: Array<string>): HTMLUListElement => {
  const list = document.createElement("ul");
  titleList.forEach((title) => {
    const listItem = document.createElement("li");
    listItem.textContent = title;
    listItem.style.padding = "2px";
    listItem.style.margin = "2px";
    listItem.style.fontSize = "0.8rem";
    listItem.style.fontWeight = "bold";
    list.appendChild(listItem);
  });

  return list;
};

const showPopup = (mouseX: number, mouseY: number, text: string): void => {
  if (currentPopup) {
    document.body.removeChild(currentPopup);
  }

  const popup: HTMLDivElement = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = "遷移先のタイトル一覧";
  title.style.fontSize = "1rem";
  title.style.fontWeight = "bold";
  popup.appendChild(title);
  popup.appendChild(createList(JSON.parse(text)));
  popup.style.position = "absolute";
  popup.style.maxHeight = "300px";
  popup.style.overflow = "auto";
  popup.style.background = "white";
  popup.style.border = "1px solid black";
  popup.style.padding = "4px";
  popup.style.zIndex = "1000";

  // ポップアップの位置を調整
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const popupWidth = 200;
  const popupHeight = 300;

  let posX = mouseX + window.scrollX + 10;
  let posY = mouseY + window.scrollY + 10;

  if (posX + popupWidth > screenWidth + window.scrollX) {
    posX = mouseX + window.scrollX - popupWidth - 10;
  }
  if (posY + popupHeight > screenHeight + window.scrollY) {
    posY = mouseY + window.scrollY - popupHeight - 10;
  }

  popup.style.left = `${posX}px`;
  popup.style.top = `${posY}px`;

  currentPopup = popup;
  document.body.appendChild(popup);

  popup.addEventListener("mouseleave", () => {
    document.body.removeChild(popup);
    currentPopup = null;
  });
};
