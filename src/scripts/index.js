import {
  createCardElement,
  isCardLiked,
  renderCardLikes,
  removeCardElement,
} from "./components/card.js";
import {
  openModalWindow,
  closeModalWindow,
  setCloseModalWindowEventListeners,
} from "./components/modal.js";
import { enableValidation, clearValidation } from "./components/validation.js"; // Импорт валидации
import {
  getUserInfo,
  getCardList,
  setUserInfo,
  setAvatar,
  postCard,
  deleteCardApi,
  changeLikeCardStatus,
} from "./components/api.js";

// Объект с настройками валидации
const validationConfig = {
  formSelector: ".popup__form",
  inputSelector: ".popup__input",
  submitButtonSelector: ".popup__button",
  inactiveButtonClass: "popup__button_disabled",
  inputErrorClass: "popup__input_type_error",
  errorClass: "popup__error_visible",
};

// Глобальная переменная для хранения ID текущего пользователя
let currentUserId;
// Переменная для хранения карточки, которую мы собираемся удалить
let cardToDelete = {};

// DOM узлы
const placesWrap = document.querySelector(".places__list");

// Попапы
const profileFormModalWindow = document.querySelector(".popup_type_edit");
const cardFormModalWindow = document.querySelector(".popup_type_new-card");
const imageModalWindow = document.querySelector(".popup_type_image");
const avatarFormModalWindow = document.querySelector(".popup_type_edit-avatar");
const removeCardModalWindow = document.querySelector(".popup_type_remove-card");

// Формы и инпуты
const profileForm = profileFormModalWindow.querySelector(".popup__form");
const profileTitleInput = profileForm.querySelector(".popup__input_type_name");
const profileDescriptionInput = profileForm.querySelector(
  ".popup__input_type_description"
);

const cardForm = cardFormModalWindow.querySelector(".popup__form");
const cardNameInput = cardForm.querySelector(".popup__input_type_card-name");
const cardLinkInput = cardForm.querySelector(".popup__input_type_url");

const avatarForm = avatarFormModalWindow.querySelector(".popup__form");
const avatarInput = avatarForm.querySelector(".popup__input");

// Элементы на странице
const imageElement = imageModalWindow.querySelector(".popup__image");
const imageCaption = imageModalWindow.querySelector(".popup__caption");
const profileTitle = document.querySelector(".profile__title");
const profileDescription = document.querySelector(".profile__description");
const profileAvatar = document.querySelector(".profile__image");

// Кнопки открытия
const openProfileFormButton = document.querySelector(".profile__edit-button");
const openCardFormButton = document.querySelector(".profile__add-button");

const removeCardForm = removeCardModalWindow.querySelector(".popup__form");

// Элементы для попапа статистики (Вариант 2)
const headerLogo = document.querySelector(".header__logo");
const usersStatsModalWindow = document.querySelector(".popup_type_info");
const usersStatsModalInfoList =
  usersStatsModalWindow.querySelector(".popup__info");
const usersStatsTitle = usersStatsModalWindow.querySelector(".popup__title");
const usersStatsText = usersStatsModalWindow.querySelector(".popup__text");
const usersStatsList = usersStatsModalWindow.querySelector(".popup__list");

// UX Функция загрузки
const renderLoading = (
  isLoading,
  button,
  buttonText = "Сохранить",
  loadingText = "Сохранение..."
) => {
  if (isLoading) {
    button.textContent = loadingText;
  } else {
    button.textContent = buttonText;
  }
};

// Функции
const handlePreviewPicture = ({ name, link }) => {
  imageElement.src = link;
  imageElement.alt = name;
  imageCaption.textContent = name;
  openModalWindow(imageModalWindow);
};

const handleLikeClick = (cardElement, cardId, likeButton, likeCountElement) => {
  const isLiked = isCardLiked(likeButton);
  changeLikeCardStatus(cardId, isLiked)
    .then((updatedCard) => {
      renderCardLikes(likeButton, likeCountElement, updatedCard.likes, currentUserId);
    })
    .catch((err) => console.log(err));
};

const handleDeleteClick = (cardElement, cardId) => {
  cardToDelete = { element: cardElement, id: cardId };
  openModalWindow(removeCardModalWindow);
};

const cardEventHandlers = {
  onPreviewPicture: handlePreviewPicture,
  onLikeIcon: handleLikeClick,
  onDeleteCard: handleDeleteClick,
};

const renderCard = (cardData, method = "append") => {
  const cardElement = createCardElement(
    cardData,
    currentUserId,
    cardEventHandlers
  );
  placesWrap[method](cardElement);
};

const setProfileData = ({ name, about, avatar }) => {
  profileTitle.textContent = name;
  profileDescription.textContent = about;

  if (avatar) {
    profileAvatar.style.backgroundImage = `url('${avatar}')`;
  }
};

const openFormModal = (modalWindow, formElement, shouldReset = false) => {
  if (shouldReset) {
    formElement.reset();
  }

  clearValidation(formElement, validationConfig);
  openModalWindow(modalWindow);
};

// Функции для статистики (Вариант 2)
const formatDate = (date) =>
  date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const createInfoString = (term, description) => {
  const template = document
    .querySelector("#popup-info-definition-template")
    .content.cloneNode(true);
  template.querySelector(".popup__info-term").textContent = term;
  template.querySelector(".popup__info-description").textContent = description;
  return template;
};

const createUserPreview = (userName) => {
  const template = document
    .querySelector("#popup-info-user-preview-template")
    .content.cloneNode(true);
  const li = template.querySelector(".popup__list-item");
  li.textContent = userName; // Вставляем имя пользователя как текст
  return template;
};

const handleLogoClick = () => {
  getCardList()
    .then((cards) => {
      // Очищаем старые данные
      usersStatsModalInfoList.innerHTML = "";
      usersStatsList.innerHTML = "";

      usersStatsTitle.textContent = "Статистика карточек";
      usersStatsText.textContent = "Все пользователи";

      if (cards.length > 0) {
        // Создаем Map (словарь) для подсчета карточек каждого автора
        const authorsMap = new Map();

        cards.forEach((card) => {
          const ownerId = card.owner._id;
          if (authorsMap.has(ownerId)) {
            authorsMap.get(ownerId).count += 1;
          } else {
            // Сохраняем имя автора и начальный счетчик = 1
            authorsMap.set(ownerId, { name: card.owner.name, count: 1 });
          }
        });

        // Считаем общее количество авторов и максимум карточек у одного
        const totalUsers = authorsMap.size;
        let maxCards = 0;
        authorsMap.forEach((user) => {
          if (user.count > maxCards) maxCards = user.count;
        });

        // 1. Добавляем всю статистику по порядку
        usersStatsModalInfoList.append(
          createInfoString("Всего карточек:", cards.length)
        );
        usersStatsModalInfoList.append(
          createInfoString(
            "Первая создана:",
            formatDate(new Date(cards[cards.length - 1].createdAt))
          )
        );
        usersStatsModalInfoList.append(
          createInfoString(
            "Последняя создана:",
            formatDate(new Date(cards[0].createdAt))
          )
        );
        usersStatsModalInfoList.append(
          createInfoString("Всего пользователей:", totalUsers)
        );
        usersStatsModalInfoList.append(
          createInfoString("Максимум карточек от одного:", maxCards)
        );

        // 2. Отрисовываем бейджики с именами авторов
        authorsMap.forEach((user) => {
          usersStatsList.append(createUserPreview(user.name));
        });
      }

      openModalWindow(usersStatsModalWindow);
    })
    .catch((err) => {
      console.log(err);
    });
};

const handleProfileFormSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = evt.submitter;
  renderLoading(true, submitButton);

  setUserInfo({
    name: profileTitleInput.value,
    about: profileDescriptionInput.value,
  })
    .then((userData) => {
      setProfileData(userData);
      closeModalWindow(profileFormModalWindow);
    })
    .catch((err) => console.log(err))
    .finally(() => renderLoading(false, submitButton));
};

const handleAvatarFromSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = evt.submitter;
  renderLoading(true, submitButton);

  setAvatar(avatarInput.value)
    .then((userData) => {
      setProfileData({
        name: profileTitle.textContent,
        about: profileDescription.textContent,
        avatar: userData.avatar,
      });
      closeModalWindow(avatarFormModalWindow);
    })
    .catch((err) => console.log(err))
    .finally(() => renderLoading(false, submitButton));
};

const handleCardFormSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = evt.submitter;
  renderLoading(true, submitButton, "Создать", "Создание...");

  postCard({
    name: cardNameInput.value,
    link: cardLinkInput.value,
  })
    .then((cardData) => {
      renderCard(cardData, "prepend");
      closeModalWindow(cardFormModalWindow);
    })
    .catch((err) => console.log(err))
    .finally(() => renderLoading(false, submitButton, "Создать"));
};

const handleRemoveCardSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = evt.submitter;
  renderLoading(true, submitButton, "Да", "Удаление...");

  deleteCardApi(cardToDelete.id)
    .then(() => {
      removeCardElement(cardToDelete.element);
      closeModalWindow(removeCardModalWindow);
    })
    .catch((err) => console.log(err))
    .finally(() => renderLoading(false, submitButton, "Да"));
};

// EventListeners для форм
profileForm.addEventListener("submit", handleProfileFormSubmit);
cardForm.addEventListener("submit", handleCardFormSubmit);
avatarForm.addEventListener("submit", handleAvatarFromSubmit);
removeCardForm.addEventListener("submit", handleRemoveCardSubmit);

// Слушатели открытия попапов с очисткой валидации
openProfileFormButton.addEventListener("click", () => {
  profileTitleInput.value = profileTitle.textContent;
  profileDescriptionInput.value = profileDescription.textContent;
  clearValidation(profileForm, validationConfig); // Очистка ошибок перед открытием
  openFormModal(profileFormModalWindow, profileForm);
});

profileAvatar.addEventListener("click", () => {
  avatarForm.reset(); // Сбрасываем форму
  clearValidation(avatarForm, validationConfig); // Блокируем кнопку и убираем ошибки
  openFormModal(avatarFormModalWindow, avatarForm, true);
});

openCardFormButton.addEventListener("click", () => {
  cardForm.reset(); // Сбрасываем форму
  clearValidation(cardForm, validationConfig); // Блокируем кнопку и убираем ошибки
  openFormModal(cardFormModalWindow, cardForm, true);
});

headerLogo.addEventListener("click", handleLogoClick);

// Настраиваем обработчики закрытия всех попапов
const allPopups = document.querySelectorAll(".popup");
allPopups.forEach((popup) => {
  setCloseModalWindowEventListeners(popup);
});

// Включение валидации
enableValidation(validationConfig);

// Инициализация данных (Promise.all)
Promise.all([getUserInfo(), getCardList()])
  .then(([userData, cardsData]) => {
    // 1. Устанавливаем данные пользователя
    currentUserId = userData._id;
    setProfileData(userData);

    // 2. Отрисовываем карточки
    cardsData.forEach((cardData) => {
      renderCard(cardData);
    });
  })
  .catch((err) => console.log(err));
