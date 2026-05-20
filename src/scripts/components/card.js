const getTemplate = () => {
  return document
    .getElementById("card-template")
    .content.querySelector(".card")
    .cloneNode(true);
};

const getLikeButton = (cardElement) =>
  cardElement.querySelector(".card__like-button");

const getLikeCountElement = (cardElement) =>
  cardElement.querySelector(".card__like-count");

export const isCardLiked = (cardElement) => {
  return getLikeButton(cardElement).classList.contains(
    "card__like-button_is-active"
  );
};

export const renderCardLikes = (cardElement, likes, userId) => {
  const likeButton = getLikeButton(cardElement);
  const likeCountElement = getLikeCountElement(cardElement);
  const isLiked = likes.some((user) => user._id === userId);

  likeCountElement.textContent = likes.length;
  likeButton.classList.toggle("card__like-button_is-active", isLiked);
};

export const removeCardElement = (cardElement) => {
  cardElement.remove();
};

export const createCardElement = (
  data,
  userId,
  { onPreviewPicture, onLikeIcon, onDeleteCard }
) => {
  const cardElement = getTemplate();
  const likeButton = getLikeButton(cardElement);
  const deleteButton = cardElement.querySelector(
    ".card__control-button_type_delete"
  );
  const cardImage = cardElement.querySelector(".card__image");

  cardImage.src = data.link;
  cardImage.alt = data.name;
  cardElement.querySelector(".card__title").textContent = data.name;

  renderCardLikes(cardElement, data.likes, userId);

  if (data.owner._id !== userId) {
    deleteButton.remove();
  } else {
    deleteButton.addEventListener("click", () =>
      onDeleteCard(cardElement, data._id)
    );
  }

  likeButton.addEventListener("click", () => onLikeIcon(cardElement, data._id));
  cardImage.addEventListener("click", () =>
    onPreviewPicture({ name: data.name, link: data.link })
  );

  return cardElement;
};
