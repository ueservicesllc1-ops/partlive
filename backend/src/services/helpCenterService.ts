import { db } from '../config/firebase';
import { HelpArticle } from '../seeds/seedHelpCenter';
import * as admin from 'firebase-admin';

export const searchHelpArticles = async (
  query?: string,
  category?: string,
  language: string = 'ES'
): Promise<HelpArticle[]> => {
  let ref: admin.firestore.Query = db.collection('helpArticles')
    .where('status', '==', 'PUBLISHED');

  if (category) {
    ref = ref.where('category', '==', category);
  }

  const snap = await ref.limit(50).get();
  let articles = snap.docs.map((doc) => doc.data() as HelpArticle);

  if (query && query.trim() !== '') {
    const qLower = query.toLowerCase();
    articles = articles.filter(
      (a) =>
        a.title.toLowerCase().includes(qLower) ||
        a.summary.toLowerCase().includes(qLower) ||
        a.keywords.some((k) => k.toLowerCase().includes(qLower))
    );
  }

  return articles;
};

export const recordArticleFeedback = async (
  articleId: string,
  helpful: boolean
): Promise<void> => {
  const ref = db.collection('helpArticles').doc(articleId);
  const field = helpful ? 'helpfulCount' : 'notHelpfulCount';

  await ref.update({
    [field]: admin.firestore.FieldValue.increment(1),
  });
};
