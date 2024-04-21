let currentPopup: HTMLDivElement | null = null;

type TitleData = {
  title: string;
  url: string;
};

// オプションの設定状態からポップアップの有効・無効を切り替える
const handlePopupActivation = () => {
  chrome.storage.sync.get("isPopupEnabled").then((data) => {
    if (data.isPopupEnabled) {
      activatePopup();
    }
  }).catch(console.error);
};

if (document.readyState === "complete") {
  handlePopupActivation();
} else {
  window.addEventListener("load", handlePopupActivation);
}

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

const parseTitleDataList = (html: Document): Array<TitleData> => {
  const titleDataList: Array<TitleData> = [];

  html.querySelectorAll(".column").forEach((column) => {
    if (!column) {
      return;
    }

    const title = column.querySelector("h3")?.textContent;
    if (!title) {
      return;
    }

    const url = column.querySelector("a")?.getAttribute("href") || "";

    titleDataList.push({ title, url });
  });

  // 最後の要素は不要なので削除
  titleDataList.pop();

  return titleDataList;
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

const activatePopup = () => {
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
            pageKey,
          );
        } else {
          fetch(url)
            .then((response) => response.text())
            .then((html) => {
              const parser = new DOMParser();
              const doc = parser.parseFromString(html, "text/html");
              const titleDataList = parseTitleDataList(doc);
              const stringifiedTitleDataList = JSON.stringify(titleDataList);
              tempStorage.setData(pageKey as string, stringifiedTitleDataList);
              showPopup(
                event.clientX,
                event.clientY,
                stringifiedTitleDataList,
                pageKey || "",
              );
            });
        }
      });
    },
  );
};

// 遷移先のページタイトルをリスト形式のHTMLにして返す
const createList = (titleDataList: Array<TitleData>): HTMLUListElement => {
  const list = document.createElement("ul");
  titleDataList.forEach((data) => {
    const listItem = document.createElement("li");
    const link = document.createElement("a");
    listItem.style.padding = "2px";
    listItem.style.margin = "2px";
    listItem.style.fontSize = "0.8rem";
    listItem.style.fontWeight = "bold";
    link.href = data.url;
    link.textContent = data.title;
    link.style.color = "blue";
    link.style.textDecoration = "underline";
    listItem.appendChild(link);
    list.appendChild(listItem);
  });

  return list;
};

const showPopup = (
  mouseX: number,
  mouseY: number,
  text: string,
  pageKey: string,
): void => {
  if (currentPopup) {
    document.body.removeChild(currentPopup);
  }

  const popup: HTMLDivElement = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = `${pageKey}ページ目の画像タイトル一覧`;
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
