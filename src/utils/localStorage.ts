import { PATH } from '@/components/04/path';
const defaultPageOfSection4 = PATH.index;
export const NAME_OF_PREVIOUS_PAGE = 'previous-page';
export const previousPageURL = () =>
  localStorage.getItem(NAME_OF_PREVIOUS_PAGE) ?? defaultPageOfSection4;
export const deletePreviousUrl = () => {
  localStorage.removeItem(NAME_OF_PREVIOUS_PAGE);
};
export const setPreviousUrl = ({ previousUrl }: { previousUrl: string }) => {
  localStorage.setItem(NAME_OF_PREVIOUS_PAGE, previousUrl);
};
