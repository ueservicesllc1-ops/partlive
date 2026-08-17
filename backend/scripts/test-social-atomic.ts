import { db } from '../src/config/firebase';
import { seedSocialConfig } from '../src/seeds/seedSocialConfig';
import { canUserAccessContent } from '../src/services/contentAccessService';
import { createPost, likePost, commentPost, getSocialFeed } from '../src/services/socialPostService';
import { createStory, recordStoryView, getActiveStoriesFeed } from '../src/services/storyService';

export const runSocialAtomicTests = async () => {
  console.log('\n==================================================');
  console.log('🌐 RUNNING SOCIAL NETWORK & STORIES ATOMIC TESTS');
  console.log('==================================================\n');

  const authorId = 'test_social_author_' + Date.now();
  const viewerId = 'test_social_viewer_' + Date.now();

  // Create Users
  await db.collection('users').doc(authorId).set({
    uid: authorId,
    displayName: 'Autor Social Test',
    status: 'active',
  });

  await db.collection('users').doc(viewerId).set({
    uid: viewerId,
    displayName: 'Espectador Social Test',
    status: 'active',
  });

  console.log('✅ Datos de Prueba Creados.');

  // 1. Seed Config
  await seedSocialConfig();

  // Test 1: Content Access Control Safeguard
  console.log('\n▶ Test 1: Probar control de acceso a contenido por visibilidad (SUBSCRIBER)...');
  const publicAccess = await canUserAccessContent(viewerId, authorId, 'PUBLIC');
  const subAccess = await canUserAccessContent(viewerId, authorId, 'SUBSCRIBER');

  console.log(`Acceso Público: ${publicAccess}, Acceso Suscriptor (sin sub): ${subAccess}`);
  if (publicAccess && !subAccess) {
    console.log('✅ Test 1 PASADO: Control de acceso restringió correctamente contenido exclusivo.');
  } else {
    console.error('❌ Test 1 FALLIDO.');
  }

  // Test 2: Create & Like Post
  console.log('\n▶ Test 2: Crear publicación social y dar Me Gusta...');
  const post = await createPost(authorId, '¡Hola comunidad PartyLive! Este es mi primer post.');
  console.log(`Post Creado ID: ${post.id}, Likes Iniciales: ${post.likesCount}`);

  const isLiked = await likePost(viewerId, post.id);
  const postDoc1 = await db.collection('posts').doc(post.id).get();
  console.log(`Post tras Me Gusta (isLiked=${isLiked}): Likes=${postDoc1.data()?.likesCount}`);

  if (isLiked && postDoc1.data()?.likesCount === 1) {
    console.log('✅ Test 2 PASADO: Me Gusta registrado e incrementado correctamente.');
  } else {
    console.error('❌ Test 2 FALLIDO.');
  }

  // Test 3: Comment on Post
  console.log('\n▶ Test 3: Comentar en publicación...');
  const comment = await commentPost(viewerId, post.id, '¡Excelente post! Éxitos.');
  const postDoc2 = await db.collection('posts').doc(post.id).get();

  console.log(`Comentario Creado ID: ${comment.id}, Comentarios totales: ${postDoc2.data()?.commentsCount}`);
  if (comment.id && postDoc2.data()?.commentsCount === 1) {
    console.log('✅ Test 3 PASADO: Comentario publicado correctamente.');
  } else {
    console.error('❌ Test 3 FALLIDO.');
  }

  // Test 4: Create 24h Story & View Count
  console.log('\n▶ Test 4: Crear Historia efímera de 24 horas y registrar visualizaciones...');
  const story = await createStory(authorId, 'https://cdn.partylive.app/stories/sample.jpg');
  await recordStoryView(viewerId, story.id);

  const activeStories = await getActiveStoriesFeed(viewerId);
  const storyDoc = await db.collection('stories').doc(story.id).get();

  console.log(`Historia Creada ID: ${story.id}, Vistas: ${storyDoc.data()?.viewsCount}, Historias Activas: ${activeStories.length}`);
  if (storyDoc.data()?.viewsCount === 1 && activeStories.length >= 1) {
    console.log('✅ Test 4 PASADO: Historia de 24 horas registrada y visualización agregada.');
  } else {
    console.error('❌ Test 4 FALLIDO.');
  }

  // Cleanup
  await db.collection('users').doc(authorId).delete();
  await db.collection('users').doc(viewerId).delete();
  await db.collection('posts').doc(post.id).delete();
  await db.collection('postLikes').doc(`${viewerId}_${post.id}`).delete();
  await db.collection('comments').doc(comment.id).delete();
  await db.collection('stories').doc(story.id).delete();
  await db.collection('storyViews').doc(`${viewerId}_${story.id}`).delete();

  console.log('\n==================================================');
  console.log('🎉 TODAS LAS PRUEBAS ATÓMICAS DE RED SOCIAL Y STORIES COMPLETADAS!');
  console.log('==================================================\n');
};

if (require.main === module) {
  runSocialAtomicTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error en pruebas Sociales:', err);
      process.exit(1);
    });
}
